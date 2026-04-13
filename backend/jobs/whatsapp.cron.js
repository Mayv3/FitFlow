import cron from 'node-cron'
import { supabaseAdmin } from '../db/supabaseClient.js'

// ─── Helpers ───────────────────────────────────────────────────────────────────

function toInstanceName(gymName) {
  return gymName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function normalizePhone(telefono) {
  if (!telefono) return null
  const digits = String(telefono).replace(/\D/g, '')
  if (digits.startsWith('54')) return digits          // ya tiene código de país
  if (digits.startsWith('0')) return '54' + digits.slice(1) // quitar el 0 inicial
  return '54' + digits                                // agregar código de país
}

function buildMessage(alumno, gymName) {
  const fecha = new Date(alumno.fecha_de_vencimiento).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires'
  })
  const planNombre = alumno.plan?.nombre ?? 'tu plan'
  const planPrecio = alumno.plan?.precio ? `\nPrecio: $${alumno.plan.precio}` : ''

  return `¡Hola ${alumno.nombre}! ¿Cómo estás?

Te escribimos desde *${gymName}* con un recordatorio rápido

Tu membresía venció el ${fecha} y te extrañamos por acá!

*Tu plan*:
${planNombre}${planPrecio}

¡Renovar es muy fácil, avisanos y te ayudamos!
Te esperamos con las puertas abiertas`
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function sendWhatsApp(evolutionUrl, instanceName, apiKey, number, text) {
  const normalizedNumber = normalizePhone(number)
  if (!normalizedNumber) return { error: 'Número inválido' }

  const res = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: apiKey },
    body: JSON.stringify({ number: normalizedNumber, text })
  })
  return res.json()
}

// ─── Job principal ─────────────────────────────────────────────────────────────

async function enviarRecordatoriosWhatsApp() {
  const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY
  const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL
  if (!EVOLUTION_API_KEY || !EVOLUTION_API_URL) {
    console.error('[WA CRON] EVOLUTION_API_KEY o EVOLUTION_API_URL no configuradas — abortando')
    return
  }

  console.log('[WA CRON] Iniciando envío de recordatorios WhatsApp...')

  // 1. Obtener gyms con WhatsApp habilitado
  const { data: gyms, error: gymsError } = await supabaseAdmin
    .from('gyms')
    .select('id, name')
    .eq('whatsapp_enabled', true)
    .is('deleted_at', null)

  if (gymsError) {
    console.error('[WA CRON] Error al obtener gyms:', gymsError.message)
    return
  }

  if (!gyms?.length) {
    console.log('[WA CRON] No hay gyms con WhatsApp habilitado')
    return
  }

  console.log(`[WA CRON] Gyms habilitados: ${gyms.length}`)
  const today = new Date().toISOString().slice(0, 10)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const cutoffDate = thirtyDaysAgo.toISOString().slice(0, 10)

  for (const gym of gyms) {
    const instanceName = toInstanceName(gym.name)

    // 2. Obtener alumnos vencidos en los últimos 30 días
    const { data: alumnos, error: alumnosError } = await supabaseAdmin
      .from('alumnos')
      .select('id, nombre, telefono, fecha_de_vencimiento, plan:planes_precios(nombre, precio)')
      .eq('gym_id', gym.id)
      .is('deleted_at', null)
      .gte('fecha_de_vencimiento', cutoffDate)
      .lt('fecha_de_vencimiento', today)
      .order('fecha_de_vencimiento', { ascending: true })

    if (alumnosError) {
      console.error(`[WA CRON] ${gym.name}: error al obtener alumnos:`, alumnosError.message)
      continue
    }

    const conTelefono = (alumnos ?? []).filter(a => a.telefono)
    console.log(`[WA CRON] ${gym.name}: ${conTelefono.length} alumnos vencidos con teléfono`)

    // 3. Enviar mensaje a cada alumno con delay anti-ban
    for (const alumno of conTelefono) {
      try {
        const mensaje = buildMessage(alumno, gym.name)
        const result = await sendWhatsApp(
          EVOLUTION_API_URL,
          instanceName,
          EVOLUTION_API_KEY,
          alumno.telefono,
          mensaje
        )
        console.log(`[WA CRON] ${gym.name} → ${alumno.nombre}: ${result.status ?? result.error ?? 'enviado'}`)
      } catch (err) {
        console.error(`[WA CRON] ${gym.name} → ${alumno.nombre}: error:`, err.message)
      }

      await delay(4000) // 4 segundos entre mensajes (anti-ban WhatsApp)
    }
  }

  console.log('[WA CRON] Envío finalizado')
}

// ─── Registro del cron ─────────────────────────────────────────────────────────

export function initWhatsappCron() {
  // Todos los días a las 10:00 AM hora Argentina
  cron.schedule('0 10 * * *', () => {
    enviarRecordatoriosWhatsApp().catch(err =>
      console.error('[WA CRON] Error inesperado:', err)
    )
  }, {
    timezone: 'America/Argentina/Buenos_Aires'
  })

  console.log('[WA CRON] Cron de WhatsApp registrado — corre todos los días a las 10:00 AM ARG')
}

// Exportar para poder correrlo manualmente desde un endpoint de testing
export { enviarRecordatoriosWhatsApp }
