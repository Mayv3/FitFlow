import fetch from 'node-fetch'
import { supabaseAdmin } from '../../config/supabaseClient.js'

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
    return name
  } catch {
    return null
  }
}

/**
 * Notifica que el WhatsApp de un gym está caído.
 * Dedupe 6h por (gymId, reason). Si no hay config de email, solo loguea.
 * @param {string} gymId
 * @param {string} reason  identificador corto del motivo (not_connected, replaced_giveup, ...)
 * @param {string} [detail]
 * @param {{ force?: boolean }} [opts]  force=true saltea el dedupe (para pruebas)
 */
export async function notifyWaDown(gymId, reason, detail = '', { force = false } = {}) {
  const key = `${gymId}:${reason}`
  const now = Date.now()
  if (!force && now - (lastAlert.get(key) || 0) < MIN_INTERVAL_MS) return
  lastAlert.set(key, now)

  const gymName = await getGymName(gymId)
  const label = gymName ? `"${gymName}" (${gymId})` : gymId

  console.error(`[wa alert] gym=${label} reason=${reason}${detail ? ' ' + detail : ''}`)

  if (!BREVO_API_KEY || !ALERT_EMAIL) return // sin config -> el console.error de arriba es la alerta

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
        subject: `⚠️ WhatsApp caído — ${gymName || gymId}`,
        textContent:
          `El WhatsApp del gimnasio ${label} no se está conectando bien.\n` +
          `Motivo: ${reason}\n` +
          (detail ? `Detalle: ${detail}\n` : '') +
          `\nLos recordatorios NO se están enviando para este gym.\n` +
          `Revisá los logs o reiniciá el backend en Render.`
      })
    })
    if (!res.ok) console.error(`[wa alert] brevo ${res.status}: ${await res.text()}`)
  } catch (e) {
    console.error(`[wa alert] send failed: ${e.message}`)
  }
}
