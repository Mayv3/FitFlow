import { supabaseAdmin } from '../../config/supabaseClient.js'
import { whatsappManager } from '../whatsapp/WhatsappManager.js'
import { notifyWaDown } from '../whatsapp/notify.js'
import { waLog, duracion } from '../whatsapp/logger.js'
import { getGymConfig } from '../whatsapp/reminders.js'
import { sendBrevoEmail, logGymEmail, backfillBrevoLogs } from '../mailing.brevo.fitnessflow.js'
import * as cola from './colaEnvios.js'

// Worker de la cola de envíos. Corre SOLO en el proceso con WHATSAPP_WORKER=true
// (el único que tiene los sockets de WhatsApp). Cada TICK_MS:
// - mantenimiento: vence pendientes viejos y marca como error, SIN reintento,
//   los que quedaron 'enviando' por un reinicio (no se sabe si llegaron).
// - emails: de a uno por segundo.
// - WhatsApp: un loop por gym, con las mismas pausas anti-spam de antes.
// Si el proceso se reinicia, al arrancar sigue con los pendientes.

// Los envíos nuevos arrancan en el acto (revisarAhora() al encolar); el tick
// solo retoma tras reinicios/reconexiones, reintenta emails y vence lo viejo.
const TICK_MS = 2 * 60_000
const TANDA_SIZE = 25
const MAX_INTENTOS_EMAIL = 3
// Recién después de este tiempo desconectado se manda la alerta: al arrancar el
// server los sockets tardan unos segundos en reconectar y no es una caída.
const ALERTA_DESCONECTADO_MS = 5 * 60_000
const REINTENTO_DESCONECTADO_MS = 60_000

// Delay fijo entre envíos = patrón robótico para el antispam de WhatsApp:
// random entre 5s y 13s, y cada TANDA_SIZE una pausa larga de 1 a 2 minutos.
const pausaWhatsapp = () => Math.round(5000 + Math.random() * 8000)
const pausaTanda = () => Math.round(60000 + Math.random() * 60000)

async function registrarWhatsapp(row) {
  const { error } = await supabaseAdmin.from('whatsapp_mensajes').insert(row)
  if (error) {
    waLog(row.gym_id, `El mensaje salió pero no quedó en el historial — ${row.nombre}`, {
      level: 'warn',
      detalle: { Error: error.message, 'Qué implica': 'No aparece en el historial del panel (la cola sí lo tiene como enviado).' }
    })
  }
}

const dependenciasReales = {
  isConnected: (gymId) => whatsappManager.isConnected(gymId),
  estadoWhatsapp: (gymId) => whatsappManager.getState(gymId)?.status ?? 'none',
  enviarWhatsapp: (gymId, jid, text) => whatsappManager.sendText(gymId, jid, text),
  registrarWhatsapp,
  gymHabilitado: async (gymId) => {
    const cfg = await getGymConfig(gymId)
    return cfg.moduleEnabled && !!cfg.gym.whatsapp_enabled
  },
  avisarCaida: (gymId, detalle) => notifyWaDown(gymId, 'not_connected', detalle),
  enviarEmail: (fila) =>
    sendBrevoEmail({
      to: fila.destinatario,
      subject: fila.payload.subject,
      text: fila.payload.text,
      html: fila.payload.html,
    }),
  registrarEmail: (fila, estado, errorMsg = null) =>
    logGymEmail({
      gymId: fila.gym_id,
      emailDestino: fila.destinatario,
      asunto: fila.payload.subject,
      tipo: fila.payload.tipo,
      estado,
      errorMsg,
      endAt: fila.payload.vencimiento,
    }),
  reconciliarEmails: () => backfillBrevoLogs({}),
  pausaWhatsapp,
  pausaTanda,
  pausaEmail: () => 1000,
}

export function crearWorker(overrides = {}) {
  const d = { ...dependenciasReales, ...overrides }
  const tickMs = overrides.tickMs ?? TICK_MS

  const gymsActivos = new Map() // gymId -> { despertar }
  const desconectadoDesde = new Map() // gymId -> timestamp de la primera vez que se lo vio caído
  const alertados = new Set()
  const reintentarDespues = new Map() // gymId -> timestamp
  let emailActivo = false
  let enTick = false
  let timer = null
  let detenido = false

  // Espera cortable: cancelar o apagar el worker no tiene que esperar hasta 2 min.
  function esperar(ms, estado) {
    return new Promise((resolve) => {
      const t = setTimeout(() => { estado.despertar = null; resolve() }, ms)
      estado.despertar = () => { clearTimeout(t); estado.despertar = null; resolve() }
    })
  }

  function manejarDesconexion(gymId) {
    const status = d.estadoWhatsapp(gymId)
    const ahora = Date.now()
    if (!desconectadoDesde.has(gymId)) {
      desconectadoDesde.set(gymId, ahora)
      waLog(gymId, 'Hay recordatorios en cola pero WhatsApp no está conectado — espero a que vuelva', {
        level: 'warn',
        detalle: { Estado: status, 'Qué pasa': 'Salen solos cuando se reconecte. Si no vuelve hoy, vencen a medianoche.' }
      })
    } else if (!alertados.has(gymId) && ahora - desconectadoDesde.get(gymId) > ALERTA_DESCONECTADO_MS) {
      alertados.add(gymId)
      Promise.resolve(d.avisarCaida(gymId, `status=${status} con recordatorios en cola`)).catch(() => {})
    }
    reintentarDespues.set(gymId, ahora + REINTENTO_DESCONECTADO_MS)
  }

  async function procesarGym(gymId) {
    const estado = { despertar: null }
    gymsActivos.set(gymId, estado)
    let enviados = 0
    let errores = 0
    const t0 = Date.now()
    try {
      if (!(await d.gymHabilitado(gymId))) {
        const cancelados = await cola.cancelarPendientes({
          gymId,
          motivo: 'WhatsApp deshabilitado para el gimnasio',
        })
        waLog(gymId, `WhatsApp deshabilitado: cancelo ${cancelados.length} recordatorios de la cola`, { level: 'warn' })
        return
      }

      while (!detenido) {
        if (!d.isConnected(gymId)) {
          manejarDesconexion(gymId)
          return
        }
        desconectadoDesde.delete(gymId)
        alertados.delete(gymId)

        const fila = await cola.tomarEnvio('whatsapp', gymId)
        if (!fila) break
        const p = fila.payload

        const base = {
          gym_id: gymId,
          alumno_id: fila.alumno_id,
          telefono: p.telefono,
          nombre: p.nombre,
          plan: p.plan,
          vencimiento: p.vencimiento,
          mensaje: p.text,
          tipo: p.tipo,
          remitente_jid: p.remitente_jid,
        }
        try {
          await d.enviarWhatsapp(gymId, fila.destinatario, p.text)
          // Marcar enseguida: si el proceso se corta después de esto, no se reenvía.
          await cola.marcarEnviado(fila.id)
          enviados++
          await d.registrarWhatsapp({ ...base, estado: 'enviado' })
          waLog(gymId, `Enviado — ${p.nombre}`, { level: 'ok', detalle: { Teléfono: p.telefono, Aviso: p.tipo } })
        } catch (e) {
          // WhatsApp no se reintenta: si el error fue después de salir, duplicaría.
          errores++
          await cola.marcarError(fila.id, e.message)
          await d.registrarWhatsapp({ ...base, estado: 'error', error_msg: e.message })
          waLog(gymId, `Falló el envío a ${p.nombre}`, { level: 'error', detalle: { Teléfono: p.telefono, Motivo: e.message } })
        }

        const hechos = enviados + errores
        const pausa = hechos % TANDA_SIZE === 0 ? d.pausaTanda() : d.pausaWhatsapp()
        if (hechos % TANDA_SIZE === 0) {
          waLog(gymId, `Pausa larga cada ${TANDA_SIZE} envíos — ${duracion(pausa)}`)
        }
        await esperar(pausa, estado)
      }
    } catch (e) {
      waLog(gymId, 'El envío de este gym se cortó por un error; sigue en el próximo ciclo', {
        level: 'error',
        detalle: { Error: e.message }
      })
    } finally {
      gymsActivos.delete(gymId)
      if (enviados + errores > 0) {
        waLog(gymId, 'Tanda de recordatorios terminada', {
          level: errores > 0 ? 'warn' : 'end',
          detalle: { Enviados: enviados, Errores: errores, Duración: duracion(Date.now() - t0) }
        })
      }
    }
  }

  async function procesarEmails() {
    emailActivo = true
    let enviados = 0
    try {
      while (!detenido) {
        const fila = await cola.tomarEnvio('email')
        if (!fila) break
        try {
          await d.enviarEmail(fila)
          await cola.marcarEnviado(fila.id)
          enviados++
          await d.registrarEmail(fila, 'enviado')
        } catch (e) {
          // Brevo rechazó el envío: el mail no salió, se puede reintentar sin duplicar.
          if (fila.intentos < MAX_INTENTOS_EMAIL) {
            await cola.volverAPendiente(fila.id, e.message)
            console.warn(`⚠️ Email a ${fila.destinatario} falló (intento ${fila.intentos}), se reintenta en el próximo ciclo:`, e.message)
            break // el próximo tick lo retoma, no reintentar en el mismo segundo
          }
          await cola.marcarError(fila.id, e.message)
          await d.registrarEmail(fila, 'error', e.message)
          console.error(`❌ Email a ${fila.destinatario} falló ${fila.intentos} veces:`, e.message)
        }
        await new Promise((r) => setTimeout(r, d.pausaEmail()))
      }
      if (enviados > 0) {
        console.log(`📬 Cola de emails: ${enviados} enviados`)
        // Reconcilia con Brevo por si algún log no se pudo guardar
        try { await d.reconciliarEmails() } catch (e) { console.error('⚠️ Backfill post-envío falló:', e.message) }
      }
    } catch (e) {
      console.error('❌ Worker de emails se cortó:', e.message)
    } finally {
      emailActivo = false
    }
  }

  async function tick() {
    // Sin iniciar() no se procesa nada: en un proceso sin WHATSAPP_WORKER
    // (ej. el backend local) revisarAhora() no tiene que ponerse a enviar.
    if (enTick || detenido || !timer) return
    enTick = true
    try {
      try {
        const r = await cola.mantenimiento()
        if (r?.vencidos || r?.interrumpidos) {
          waLog(null, 'Mantenimiento de la cola de envíos', {
            level: r.interrumpidos ? 'warn' : 'info',
            detalle: {
              'Vencidos sin enviar': r.vencidos || undefined,
              'Interrumpidos por reinicio (no se reintentan)': r.interrumpidos || undefined,
            }
          })
        }
      } catch (e) {
        console.warn('[cola] mantenimiento falló:', e.message)
      }

      if (!emailActivo && (await cola.hayPendientes('email'))) {
        procesarEmails()
      }

      const ahora = Date.now()
      for (const gymId of await cola.gymsConPendientes('whatsapp')) {
        if (gymsActivos.has(gymId)) continue
        if ((reintentarDespues.get(gymId) ?? 0) > ahora) continue
        procesarGym(gymId)
      }
    } catch (e) {
      console.warn('[cola] tick falló:', e.message)
    } finally {
      enTick = false
    }
  }

  return {
    iniciar() {
      if (timer) return
      detenido = false
      timer = setInterval(tick, tickMs)
      tick()
    },
    detener() {
      detenido = true
      clearInterval(timer)
      timer = null
      for (const estado of gymsActivos.values()) estado.despertar?.()
    },
    /** Revisa la cola ya (ej. después de encolar), sin esperar al próximo tick. */
    revisarAhora() {
      reintentarDespues.clear()
      tick()
    },
    /** Corta la espera entre mensajes (ej. después de cancelar) para que reaccione al toque. */
    despertar(gymId = null) {
      for (const [id, estado] of gymsActivos) {
        if (!gymId || id === gymId) estado.despertar?.()
      }
    },
    estado() {
      return { gymsActivos: [...gymsActivos.keys()], emailActivo }
    },
  }
}

export const workerEnvios = crearWorker()
