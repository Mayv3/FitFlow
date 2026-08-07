import fetch from 'node-fetch'
import { supabaseAdmin } from '../../config/supabaseClient.js'
import { waLog, rememberGymName } from './logger.js'

// Alerta best-effort cuando el WhatsApp de un gym queda caído.
// NUNCA tira: no debe romper el flujo de reconexión ni el envío de recordatorios.
// Self-contained a propósito (no importa mailing.brevo.*, que tira si falta la API key).

const BREVO_API_KEY = process.env.BREVO_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL || 'notificaciones@fitnessflow.app'
// Destino de las alertas. Override con env WA_ALERT_EMAIL; default al mail de Nico.
const ALERT_EMAIL = process.env.WA_ALERT_EMAIL || 'nicopereyra855@gmail.com'
const MIN_INTERVAL_MS = 6 * 60 * 60 * 1000 // 6h por (gym+motivo): no spamear

const lastAlert = new Map() // `${gymId}:${reason}` -> timestamp del último envío

// Cache best-effort de nombres de gym para no pegarle a la DB en cada alerta.
const gymNameCache = new Map() // gymId -> name

async function getGymName(gymId) {
  if (gymNameCache.has(gymId)) return gymNameCache.get(gymId)
  try {
    const { data } = await supabaseAdmin
      .from('gyms')
      .select('name')
      .eq('id', gymId)
      .maybeSingle()
    const name = data?.name || null
    gymNameCache.set(gymId, name)
    rememberGymName(gymId, name) // que los logs de este gym salgan con nombre
    return name
  } catch {
    return null
  }
}

// Texto por motivo. El default sirve para caídas transitorias (reconecta solo);
// los motivos terminales necesitan decir qué acción manual destraba la sesión.
const REASON_COPY = {
  logged_out: {
    subject: (name) => `🔴 WhatsApp desvinculado — ${name}`,
    body: (label, detail) =>
      `WhatsApp cerró la sesión del gimnasio ${label} (código 401).\n` +
      (detail ? `${detail}\n` : '') +
      `\nEsto pasa cuando el dispositivo "FitFlow (Ubuntu)" se elimina desde\n` +
      `WhatsApp → Dispositivos vinculados, o si se reinstaló/cambió el teléfono.\n` +
      `\nLas credenciales quedaron inservibles y se borraron solas: este mail es el\n` +
      `único registro del número afectado, guardalo.\n` +
      `\nLos recordatorios NO se envían hasta volver a vincular.\n` +
      `Para recuperarlo: panel del gym → Vincular WhatsApp → escanear el QR.`
  },
  manual_disconnect: {
    subject: (name) => `🔌 WhatsApp desvinculado desde el panel — ${name}`,
    body: (label, detail) =>
      `Se desvinculó el WhatsApp del gimnasio ${label} desde el panel de FitFlow.\n` +
      (detail ? `${detail}\n` : '') +
      `\nSe borraron las credenciales y se liberó el número.\n` +
      `Los recordatorios NO se envían hasta escanear un QR nuevo.`
  },
  forbidden: {
    subject: (name) => `🚫 WhatsApp bloqueó la cuenta (403) — ${name}`,
    body: (label, detail) =>
      `WhatsApp rechazó la conexión del gimnasio ${label} con código 403 (forbidden).\n` +
      (detail ? `${detail}\n` : '') +
      `\nGeneralmente pasa por patrón de envío (mensajes masivos a números que no\n` +
      `tienen el contacto guardado, poco tiempo entre uno y otro). Puede ser\n` +
      `restricción temporal o ban del número.\n` +
      `\nLas credenciales NO se borraron: si la restricción se levanta, reconecta sola.\n` +
      `Revisá WhatsApp en el celu vinculado por si aparece un aviso de cuenta restringida.\n` +
      `\nLos recordatorios NO se envían hasta que reconecte.`
  }
}

/**
 * Notifica que el WhatsApp de un gym está caído.
 * Dedupe 6h por (gymId, reason). Si no hay config de email, solo loguea.
 * @param {string} gymId
 * @param {string} reason  identificador corto del motivo (not_connected, logged_out, manual_disconnect, replaced_giveup, ...)
 * @param {string} [detail]
 * @param {{ force?: boolean }} [opts]  force=true saltea el dedupe (para pruebas y eventos puntuales)
 */
export async function notifyWaDown(gymId, reason, detail = '', { force = false } = {}) {
  const key = `${gymId}:${reason}`
  const now = Date.now()
  if (!force && now - (lastAlert.get(key) || 0) < MIN_INTERVAL_MS) return
  lastAlert.set(key, now)

  const gymName = await getGymName(gymId)
  const label = gymName ? `"${gymName}" (${gymId})` : gymId

  waLog(gymId, `ALERTA — ${reason}`, {
    level: 'error',
    detalle: {
      Detalle: detail || undefined,
      Mail: BREVO_API_KEY && ALERT_EMAIL ? `se manda a ${ALERT_EMAIL}` : 'sin configurar (BREVO_API_KEY), este log es la única alerta'
    }
  })

  if (!BREVO_API_KEY || !ALERT_EMAIL) return // sin config -> el waLog de arriba es la alerta

  const copy = REASON_COPY[reason]
  const when = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })
  const subject = copy
    ? copy.subject(gymName || gymId)
    : `⚠️ WhatsApp caído — ${gymName || gymId}`
  const body = copy
    ? copy.body(label, detail)
    : `El WhatsApp del gimnasio ${label} no se está conectando bien.\n` +
      `Motivo: ${reason}\n` +
      (detail ? `Detalle: ${detail}\n` : '') +
      `\nLos recordatorios NO se están enviando para este gym.\n` +
      `Revisá los logs o reiniciá el backend en Render.`

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: { email: FROM_EMAIL, name: 'FitFlow Alertas' },
        to: [{ email: ALERT_EMAIL }],
        subject,
        textContent: `${body}\n\nFecha del evento: ${when} (hora Argentina)\nMotivo interno: ${reason}\nGym ID: ${gymId}`
      })
    })
    if (!res.ok) {
      waLog(gymId, 'No se pudo mandar el mail de alerta', {
        level: 'error',
        detalle: { 'Brevo respondió': res.status, Respuesta: await res.text() }
      })
    }
  } catch (e) {
    waLog(gymId, 'No se pudo mandar el mail de alerta', {
      level: 'error',
      detalle: { Error: e.message }
    })
  }
}
