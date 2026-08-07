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
import { supabaseAdmin } from '../../config/supabaseClient.js'
import { notifyWaDown } from './notify.js'
import { waLog, logCierre, primeGymName } from './logger.js'

// Recuperación tras 440 (connectionReplaced). En deploys de Render dos instancias
// se solapan con las mismas creds -> 440. Ceder es correcto para no entrar en guerra,
// PERO si la que reemplazó era la instancia vieja que Render está por matar, quedaríamos
// sin nadie conectado y en corte mudo. Por eso: tras ceder, chequear a los N segundos
// y reconectar si seguimos caídos, con un tope de intentos para no hacer ping-pong.
const REPLACED_RECOVERY_MS = 90 * 1000 // esperar a que Render mate la instancia vieja
const MAX_REPLACED_RECOVERIES = 3

// Estados sin socket vivo detrás: volver a llamar connect() debe abrir uno nuevo.
// 'logged_out' y 'number_in_use' son rechazos terminales de WhatsApp; 'replaced'
// tiene su propio timer de recuperación pero también puede reintentarse a mano.
const RECONNECTABLE_STATES = new Set(['disconnected', 'logged_out', 'number_in_use', 'forbidden'])

const logger = pino({ level: 'silent' })

// Estados internos traducidos. Se usan en el error de sendText, que queda
// guardado en whatsapp_mensajes.error_msg y lo lee el dueño del gym.
const ESTADOS = {
  none: 'nunca se inició la sesión en este proceso (el backend arrancó recién o el gym no está vinculado)',
  disconnected: 'la sesión está caída',
  connecting: 'todavía se está conectando, esperá unos segundos',
  qr: 'falta escanear el QR desde el panel',
  replaced: 'otra conexión tomó la sesión (hay dos procesos con las mismas credenciales)',
  logged_out: 'WhatsApp cerró la sesión (401), hay que volver a escanear el QR',
  forbidden: 'WhatsApp bloqueó la cuenta (403)',
  number_in_use: 'el número ya está vinculado a otro gimnasio'
}

function describirEstado(status) {
  return ESTADOS[status] ? `${ESTADOS[status]} (estado: ${status})` : `estado: ${status}`
}

// Silencia el spam de libsignal al rotar sesión de cifrado por contacto —
// vuelca buffers de claves por consola en cada rotación, una por mensaje.
// Usa console.info (session_record.js), no console.log; por eso van los dos.
function silenciarCierreSesion(metodo) {
  const original = console[metodo]
  console[metodo] = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Closing session')) return
    original(...args)
  }
}
silenciarCierreSesion('log')
silenciarCierreSesion('info')

class WhatsappManager {
  constructor() {
    /** @type {Map<string, {sock:any,status:string,qr:string|null,qrDataUrl:string|null,lastError:string|null}>} */
    this.instances = new Map()
    this.connecting = new Map() // gymId -> Promise (avoid double connect)
    this.reconnectTimers = new Map() // gymId -> NodeJS.Timeout (cancel en disconnect)
    this.reconnectAttempts = new Map() // gymId -> number (para backoff exponencial)
    this.replacedRecoveries = new Map() // gymId -> number (intentos de recuperación tras 440)
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

  // Devuelve el id de otro gimnasio que ya tenga vinculado este número, o null.
  async _findGymUsingNumber(jid, exceptGymId) {
    const normalized = jidNormalizedUser(jid)
    if (!normalized) return null
    const { data, error } = await supabaseAdmin
      .from('gyms')
      .select('id')
      .eq('settings->whatsapp->>admin_jid', normalized)
      .neq('id', exceptGymId)
      .limit(1)
    if (error) {
      waLog(exceptGymId, 'No pude chequear si el número ya está en otro gimnasio', {
        level: 'warn',
        detalle: { Error: error.message, 'Qué hago': 'Sigo con el vínculo igual.' }
      })
      return null
    }
    return data?.[0]?.id || null
  }

  // Guarda admin_jid en gyms.settings.whatsapp sin pisar el resto de settings.
  async _persistAdminJid(gymId, jid) {
    const normalized = jidNormalizedUser(jid)
    if (!normalized) return
    const { data } = await supabaseAdmin
      .from('gyms')
      .select('settings')
      .eq('id', gymId)
      .maybeSingle()
    const settings = data?.settings || {}
    settings.whatsapp = { ...(settings.whatsapp || {}), admin_jid: normalized }
    await supabaseAdmin.from('gyms').update({ settings }).eq('id', gymId)
  }

  // Libera el número (admin_jid = null) para que pueda vincularse en otro gimnasio.
  async _clearAdminJid(gymId) {
    const { data } = await supabaseAdmin
      .from('gyms')
      .select('settings')
      .eq('id', gymId)
      .maybeSingle()
    const settings = data?.settings || {}
    if (!settings.whatsapp) return
    settings.whatsapp = { ...settings.whatsapp, admin_jid: null }
    await supabaseAdmin.from('gyms').update({ settings }).eq('id', gymId)
  }

  async connect(gymId) {
    if (this.connecting.has(gymId)) return this.connecting.get(gymId)

    // Si ya hay un socket vivo (conectando/qr/conectado) o cedido por replace,
    // NO abrir otro: dos sockets con las mismas creds => WhatsApp tira 440 en loop.
    // Los estados terminales sí permiten reintento: no hay socket detrás (inst.sock=null)
    // y sin esto el gym queda trabado para siempre — el botón "Vincular" devolvía la
    // instancia muerta y nunca emitía QR.
    const existing = this.instances.get(gymId)
    if (existing && !RECONNECTABLE_STATES.has(existing.status)) return existing

    const p = this._connect(gymId).finally(() => this.connecting.delete(gymId))
    this.connecting.set(gymId, p)
    return p
  }

  async _connect(gymId) {
    primeGymName(gymId) // que los logs de esta sesión salgan con nombre, no con UUID
    const { state, saveCreds } = await useSupabaseAuthState(gymId)
    const { version } = await fetchLatestBaileysVersion()
    waLog(gymId, 'Abriendo conexión con WhatsApp…', {
      level: 'start',
      detalle: { 'Versión Baileys': version.join('.') }
    })

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
        const primerQr = inst.status !== 'qr'
        inst.qr = qr
        inst.status = 'qr'
        try {
          inst.qrDataUrl = await QRCode.toDataURL(qr)
        } catch (e) {
          waLog(gymId, 'No pude generar la imagen del QR', {
            level: 'error',
            detalle: { Error: e.message }
          })
        }
        if (primerQr) {
          waLog(gymId, 'Esperando escaneo del QR', {
            detalle: {
              'Qué hago': 'El QR está disponible en el panel del gym → Vincular WhatsApp.',
              Recordatorios: 'NO se envía nada hasta que alguien escanee.'
            }
          })
        }
      }

      if (connection === 'open') {
        const myJid = jidNormalizedUser(sock.user?.id || '')

        // Un número de WhatsApp solo puede estar vinculado a UN gimnasio.
        const conflictGym = myJid ? await this._findGymUsingNumber(myJid, gymId) : null
        if (conflictGym) {
          inst.status = 'number_in_use'
          inst.qr = null
          inst.qrDataUrl = null
          inst.lastError = 'Este número ya está vinculado a otro gimnasio. Usá otro número o desvinculalo del otro gimnasio primero.'
          this._clearReconnect(gymId)
          waLog(gymId, 'Vínculo rechazado: el número ya está en otro gimnasio', {
            level: 'error',
            detalle: {
              Número: myJid,
              'Ya usado por': conflictGym,
              'Qué hago': 'Cierro sesión y borro las credenciales que se acababan de guardar.',
              'Qué hacer': 'Usar otro número, o desvincularlo del otro gimnasio primero.'
            }
          })
          // Quitar listeners ANTES de logout: evita reentrar acá con el 'close' (loggedOut)
          // y que se borre el inst con el mensaje de error.
          try { sock.ev?.removeAllListeners?.() } catch {}
          try { await sock.logout() } catch { try { sock.end?.(undefined) } catch {} }
          inst.sock = null
          // El logout de arriba desvinculó el dispositivo: las creds que se
          // acababan de guardar al escanear el QR ya no sirven. Dejarlas solo
          // ensucia la tabla y hace que el próximo connect() reintente con una
          // sesión muerta en vez de pedir QR.
          deleteSession(gymId, { reason: 'logged_out' }).catch((e) =>
            waLog(gymId, 'Falló la limpieza de credenciales tras rechazar el vínculo', {
              level: 'error',
              detalle: { Error: e.message }
            })
          )
          return
        }

        inst.status = 'connected'
        inst.qr = null
        inst.qrDataUrl = null
        inst.lastError = null
        this.reconnectAttempts.delete(gymId) // reset backoff al conectar OK
        this.replacedRecoveries.delete(gymId) // reset recuperación 440 al conectar OK
        // Persistir el número server-side (autoritativo para el chequeo de unicidad).
        this._persistAdminJid(gymId, myJid).catch((e) =>
          waLog(gymId, 'No pude guardar el admin_jid del gym', {
            level: 'error',
            detalle: { Error: e.message }
          })
        )
        waLog(gymId, 'CONECTADO — listo para enviar', {
          level: 'ok',
          detalle: { Número: myJid, 'Nombre WhatsApp': sock.user?.name || '—' }
        })
      }

      if (connection === 'close') {
        const code = new Boom(lastDisconnect?.error)?.output?.statusCode
        const loggedOut = code === DisconnectReason.loggedOut
        const restartRequired = code === DisconnectReason.restartRequired
        const replaced = code === DisconnectReason.connectionReplaced // 440
        const forbidden = code === DisconnectReason.forbidden // 403
        logCierre(gymId, code, { Número: jidNormalizedUser(inst.sock?.user?.id || '') || undefined })

        // cerrar socket viejo SIEMPRE
        try { inst.sock?.ev?.removeAllListeners?.() } catch {}
        try { inst.sock?.end?.(undefined) } catch {}

        if (loggedOut) {
          inst.status = 'logged_out'
          inst.lastError = 'WhatsApp cerró la sesión (401). Volvé a vincular escaneando un QR nuevo.'
          this._clearReconnect(gymId)
          // El número se lee ANTES de soltar el socket: es lo único que identifica
          // qué línea se cayó, y se va con las creds cuando las borremos.
          const jid = jidNormalizedUser(inst.sock?.user?.id || '') || null
          inst.sock = null

          // Un 401 no es ambiguo: WhatsApp dice que este dispositivo ya no está
          // registrado. Esas creds no vuelven a funcionar — reconectar con ellas
          // da 401 de nuevo y nunca emite QR, dejando al gym trabado. Se borran
          // para que el próximo connect() arranque de cero.
          deleteSession(gymId, { reason: 'logged_out' })
            .then(() =>
              waLog(gymId, 'Credenciales borradas tras el 401', {
                level: 'warn',
                detalle: {
                  Número: jid || 'desconocido',
                  'Qué hacer': 'Panel del gym → Vincular WhatsApp → escanear QR nuevo.'
                }
              })
            )
            .catch((e) =>
              waLog(gymId, 'No pude borrar las credenciales tras el 401', {
                level: 'error',
                detalle: {
                  Error: e.message,
                  'Por qué importa': 'Con creds muertas el próximo intento vuelve a dar 401 y nunca emite QR.'
                }
              })
            )

          // Evento terminal y puntual: avisar SIEMPRE (force) para tener registro
          // del momento exacto en que se cayó el vínculo. Sin esto solo nos
          // enterábamos por el cron, hasta 24h después y filtrado por el dedupe.
          // El mail queda como único rastro del número, ya que las creds se borran.
          notifyWaDown(
            gymId,
            'logged_out',
            jid ? `Número afectado: ${jid}` : '',
            { force: true }
          ).catch(() => {})
          return
        }

        if (replaced) {
          // Otra conexión tomó la sesión (otra instancia/proceso con las mismas creds).
          // Reconectar YA se la roba de vuelta => guerra 440. Cedemos de inmediato.
          this._clearReconnect(gymId)
          inst.sock = null
          inst.status = 'replaced'
          inst.lastError = 'connection_replaced'

          // Pero no cedemos para siempre: si la que reemplazó era la instancia vieja
          // que Render está por matar (deploy con overlap), quedaríamos sin nadie
          // conectado. Chequeo diferido: si a los REPLACED_RECOVERY_MS seguimos caídos,
          // reconecto UNA vez. Con tope para no hacer ping-pong si la otra sigue viva.
          const recoveries = this.replacedRecoveries.get(gymId) || 0
          if (recoveries >= MAX_REPLACED_RECOVERIES) {
            waLog(gymId, 'ABANDONO la sesión tras 3 intentos de recuperación', {
              level: 'error',
              detalle: {
                'Qué pasó': `Cedí ${recoveries} veces y otra conexión me la sacó siempre. Hay otro proceso vivo con las mismas credenciales.`,
                'Qué hago': 'Dejo de pelear para no entrar en guerra de reconexiones 440.',
                'Qué hacer': 'Verificar que no haya dos instancias del backend corriendo, y reiniciar el server.',
                Recordatorios: 'NO se envía nada hasta reiniciar.'
              }
            })
            notifyWaDown(gymId, 'replaced_giveup', `tras ${recoveries} intentos de recuperación`).catch(() => {})
            return
          }
          this.replacedRecoveries.set(gymId, recoveries + 1)
          waLog(gymId, `Cedo la sesión y reviso en ${REPLACED_RECOVERY_MS / 1000}s`, {
            level: 'warn',
            detalle: {
              Intento: `${recoveries + 1} de ${MAX_REPLACED_RECOVERIES}`,
              'Por qué': 'Reconectar ya mismo se la roba de vuelta a la otra conexión y arranca la guerra 440.'
            }
          })

          const t = setTimeout(() => {
            this.reconnectTimers.delete(gymId)
            // Si otra ruta ya reconectó, no tocar nada.
            if (this.instances.get(gymId)?.status === 'connected') {
              this.replacedRecoveries.delete(gymId)
              return
            }
            waLog(gymId, 'Sigo caído después de ceder — reconecto', {
              level: 'warn',
              detalle: {
                Recuperación: `${recoveries + 1} de ${MAX_REPLACED_RECOVERIES}`,
                'Por qué': 'La conexión que me reemplazó tampoco quedó viva (típico de deploy con dos instancias solapadas).'
              }
            })
            this.instances.delete(gymId)
            this.connect(gymId).catch((e) =>
              waLog(gymId, 'Falló el reintento de recuperación', {
                level: 'error',
                detalle: { Error: e.message }
              })
            )
          }, REPLACED_RECOVERY_MS)
          this.reconnectTimers.set(gymId, t)
          return
        }

        if (forbidden) {
          // WhatsApp rechaza esta cuenta explícito (403) — a diferencia de 408/428/515
          // (ambiguos, reconectan solos), acá reintentar en loop no sirve mientras dure
          // el bloqueo: solo quema recursos en Render. NO borramos creds: si es
          // restricción temporal, las mismas creds vuelven a andar cuando se levante.
          this._clearReconnect(gymId)
          inst.status = 'forbidden'
          inst.lastError = 'WhatsApp bloqueó esta cuenta (403). Puede ser restricción temporal o ban — revisar el número en el celu vinculado.'
          inst.sock = null
          notifyWaDown(gymId, 'forbidden', 'WhatsApp devolvió 403 (forbidden) al conectar', { force: true }).catch(() => {})
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

        if (!restartRequired) {
          waLog(gymId, `Reintento programado en ${Math.round(delay / 1000)}s`, {
            detalle: { Intento: attempts + 1, 'Último error': inst.lastError || '—' }
          })
        }

        const prev = this.reconnectTimers.get(gymId)
        if (prev) clearTimeout(prev)
        const t = setTimeout(() => {
          this.reconnectTimers.delete(gymId)
          this.connect(gymId).catch((e) =>
            waLog(gymId, 'Falló el reintento de conexión', {
              level: 'error',
              detalle: { Error: e.message }
            })
          )
        }, delay)
        this.reconnectTimers.set(gymId, t)
      }
    })

    return inst
  }

  async disconnect(gymId, { deleteCredentials = false } = {}) {
    this._clearReconnect(gymId)
    this.replacedRecoveries.delete(gymId)
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
    // Mantener las credenciales salvo que el controlador haya pedido una
    // desvinculación manual de forma explícita.
    if (deleteCredentials) {
      await deleteSession(gymId, { reason: 'manual_disconnect' })
    }
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
      // Este texto termina en whatsapp_mensajes.error_msg y se ve en el panel:
      // tiene que explicar el estado, no solo nombrarlo.
      const status = inst?.status ?? 'none'
      throw new Error(`WhatsApp no conectado — ${describirEstado(status)}`)
    }
    const normalized = jidNormalizedUser(jid)
    const res = await inst.sock.sendMessage(normalized, { text })
    return res
  }
}

export const whatsappManager = new WhatsappManager()
