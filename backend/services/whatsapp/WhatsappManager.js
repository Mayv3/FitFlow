import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  jidNormalizedUser
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import QRCode from 'qrcode'
import { useSupabaseAuthState, deleteSession } from './supabaseAuthState.js'

const logger = pino({ level: 'silent' })

// Silence Baileys "Closing session" spam once
const _origLog = console.log
console.log = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Closing session')) return
  _origLog(...args)
}

class WhatsappManager {
  constructor() {
    /** @type {Map<string, {sock:any,status:string,qr:string|null,qrDataUrl:string|null,lastError:string|null}>} */
    this.instances = new Map()
    this.connecting = new Map() // gymId -> Promise (avoid double connect)
    this.reconnectTimers = new Map() // gymId -> NodeJS.Timeout (cancel en disconnect)
    this.reconnectAttempts = new Map() // gymId -> number (para backoff exponencial)
  }

  _clearReconnect(gymId) {
    const t = this.reconnectTimers.get(gymId)
    if (t) { clearTimeout(t); this.reconnectTimers.delete(gymId) }
    this.reconnectAttempts.delete(gymId)
  }

  getState(gymId) {
    const inst = this.instances.get(gymId)
    if (!inst) return { status: 'disconnected', qr: null, qrDataUrl: null, lastError: null, me: null }
    return {
      status: inst.status,
      qr: inst.qr,
      qrDataUrl: inst.qrDataUrl,
      lastError: inst.lastError,
      me: inst.sock?.user
        ? { id: jidNormalizedUser(inst.sock.user.id), name: inst.sock.user.name }
        : null
    }
  }

  isConnected(gymId) {
    return this.instances.get(gymId)?.status === 'connected'
  }

  async connect(gymId) {
    if (this.connecting.has(gymId)) return this.connecting.get(gymId)

    // Si ya hay un socket vivo (conectando/qr/conectado) o cedido por replace,
    // NO abrir otro: dos sockets con las mismas creds => WhatsApp tira 440 en loop.
    const existing = this.instances.get(gymId)
    if (existing && existing.status !== 'disconnected') return existing

    const p = this._connect(gymId).finally(() => this.connecting.delete(gymId))
    this.connecting.set(gymId, p)
    return p
  }

  async _connect(gymId) {
    const { state, saveCreds } = await useSupabaseAuthState(gymId)
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
      version,
      browser: Browsers.ubuntu('FitFlow'),
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger)
      },
      logger,
      connectTimeoutMs: 60000,
      retryRequestDelayMs: 2000
    })

    const inst = {
      sock,
      status: 'connecting',
      qr: null,
      qrDataUrl: null,
      lastError: null
    }
    this.instances.set(gymId, inst)

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (u) => {
      const { connection, lastDisconnect, qr } = u

      if (qr) {
        inst.qr = qr
        inst.status = 'qr'
        try {
          inst.qrDataUrl = await QRCode.toDataURL(qr)
        } catch (e) {
          console.warn(`[wa ${gymId}] qr encode error:`, e.message)
        }
      }

      if (connection === 'open') {
        inst.status = 'connected'
        inst.qr = null
        inst.qrDataUrl = null
        inst.lastError = null
        this.reconnectAttempts.delete(gymId) // reset backoff al conectar OK
        console.log(`[wa ${gymId}] connected`)
      }

      if (connection === 'close') {
        const code = new Boom(lastDisconnect?.error)?.output?.statusCode
        const loggedOut = code === DisconnectReason.loggedOut
        const restartRequired = code === DisconnectReason.restartRequired
        const replaced = code === DisconnectReason.connectionReplaced // 440
        console.warn(`[wa ${gymId}] closed (${code}) loggedOut=${loggedOut} restart=${restartRequired} replaced=${replaced}`)

        // cerrar socket viejo SIEMPRE
        try { inst.sock?.ev?.removeAllListeners?.() } catch {}
        try { inst.sock?.end?.(undefined) } catch {}

        if (loggedOut) {
          inst.status = 'logged_out'
          inst.lastError = null
          this._clearReconnect(gymId)
          this.instances.delete(gymId)
          try {
            await deleteSession(gymId)
          } catch (e) {
            console.warn(`[wa ${gymId}] cleanup error:`, e.message)
          }
          return
        }

        if (replaced) {
          // Otra conexión tomó la sesión (otra instancia/proceso con las mismas creds).
          // Reconectar acá se la roba de vuelta => guerra 440 infinita. CEDEMOS.
          // Recuperar: asegurar una sola instancia y reconectar manual (o reiniciar server).
          this._clearReconnect(gymId)
          inst.sock = null
          inst.status = 'replaced'
          inst.lastError = 'connection_replaced'
          console.warn(`[wa ${gymId}] reemplazada por otra sesión — NO reconecto. Verificá que solo UNA instancia use estas creds.`)
          return
        }

        // resto (408 timeout, 428 closed, 515 restart): reconnect con backoff exponencial
        inst.lastError = restartRequired ? null : (lastDisconnect?.error?.message || `code ${code}`)
        this.instances.delete(gymId)

        const attempts = this.reconnectAttempts.get(gymId) || 0
        const delay = restartRequired
          ? 200
          : Math.min(3000 * 2 ** attempts, 5 * 60 * 1000) // 3s,6s,12s,24s… tope 5min
        if (!restartRequired) this.reconnectAttempts.set(gymId, attempts + 1)

        const prev = this.reconnectTimers.get(gymId)
        if (prev) clearTimeout(prev)
        const t = setTimeout(() => {
          this.reconnectTimers.delete(gymId)
          this.connect(gymId).catch((e) =>
            console.warn(`[wa ${gymId}] reconnect failed:`, e.message)
          )
        }, delay)
        this.reconnectTimers.set(gymId, t)
      }
    })

    return inst
  }

  async disconnect(gymId) {
    this._clearReconnect(gymId)
    const inst = this.instances.get(gymId)
    if (inst?.sock) {
      try { inst.sock.ev?.removeAllListeners?.() } catch {}
      try {
        await inst.sock.logout()
      } catch {
        try { inst.sock.end?.() } catch {}
      }
    }
    this.instances.delete(gymId)
    await deleteSession(gymId)
  }

  buildJid(numero, prefix = '549') {
    const clean = String(numero || '').replace(/^0/, '').replace(/[^0-9]/g, '')
    if (!clean) return null
    if (clean.startsWith(prefix)) return `${clean}@s.whatsapp.net`
    return `${prefix}${clean}@s.whatsapp.net`
  }

  async sendText(gymId, jid, text) {
    const inst = this.instances.get(gymId)
    if (!inst || inst.status !== 'connected') {
      throw new Error(`gym ${gymId} not connected (status=${inst?.status ?? 'none'})`)
    }
    const normalized = jidNormalizedUser(jid)
    console.log(`[wa ${gymId}] sendText → ${normalized}`)
    const res = await inst.sock.sendMessage(normalized, { text })
    console.log(`[wa ${gymId}] sendText ok id=${res?.key?.id}`)
    return res
  }
}

export const whatsappManager = new WhatsappManager()
