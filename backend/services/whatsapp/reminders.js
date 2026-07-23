import dayjs from 'dayjs'
import { supabaseAdmin } from '../../config/supabaseClient.js'
import { whatsappManager } from './WhatsappManager.js'
import { notifyWaDown } from './notify.js'

const DEFAULT_TEMPLATE =
  'Hola {nombre}, tu plan {plan} {estado} el {fecha}. ¡Renoválo para seguir entrenando! 💪'

function fmt(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function getGymConfig(gymId) {
  const { data, error } = await supabaseAdmin
    .from('gyms')
    .select('id,name,settings,whatsapp_enabled')
    .eq('id', gymId)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error(`gym ${gymId} not found`)
  const wa = data.settings?.whatsapp || {}
  return {
    gym: data,
    moduleEnabled: !!data.settings?.whatsapp_module_enabled,
    countryPrefix: wa.country_prefix || '549',
    daysBefore: Number.isFinite(wa.reminder_days_before) ? wa.reminder_days_before : 3,
    template: wa.template || DEFAULT_TEMPLATE,
    adminJid: wa.admin_jid || null,
    delayMs: Number.isFinite(wa.send_delay_ms) ? wa.send_delay_ms : 2000
  }
}

async function fetchAlumnosToRemind(gymId, daysBefore) {
  const today = dayjs().startOf('day')
  // Solo 2 fechas exactas: vencen HOY y vencen dentro de `daysBefore` días.
  // NO los días intermedios. (Si daysBefore=0, queda solo hoy.)
  const dueDays = Array.from(new Set([
    today.format('YYYY-MM-DD'),
    today.add(daysBefore, 'day').format('YYYY-MM-DD')
  ]))

  const { data, error } = await supabaseAdmin
    .from('alumnos')
    .select('id,nombre,telefono,fecha_de_vencimiento,plan_id,planes_precios(nombre)')
    .eq('gym_id', gymId)
    .in('fecha_de_vencimiento', dueDays)
    .is('deleted_at', null)
  if (error) throw error
  return (data || []).filter((a) => a.telefono)
}

// Dos avisos por ciclo: 'recordatorio_previo' (N días antes) y
// 'recordatorio_vencimiento' (el día del vencimiento).
const REMINDER_TIPOS = ['recordatorio_previo', 'recordatorio_vencimiento']

async function fetchAlreadySent(gymId, alumnoIds, vencimientos) {
  if (!alumnoIds.length) return new Set()
  // Filtrar por las vencimiento dates exactas en juego — evita traer historia entera.
  const uniqueVenc = Array.from(new Set(vencimientos.filter(Boolean)))
  if (!uniqueVenc.length) return new Set()
  const { data, error } = await supabaseAdmin
    .from('whatsapp_mensajes')
    .select('alumno_id,vencimiento,tipo')
    .eq('gym_id', gymId)
    .in('tipo', REMINDER_TIPOS)
    .eq('estado', 'enviado')
    .in('alumno_id', alumnoIds)
    .in('vencimiento', uniqueVenc)
  if (error) {
    console.warn('[wa-dedupe] query error:', error.message)
    return new Set()
  }
  // Key incluye el tipo de aviso: cada alumno puede recibir el previo Y el del día
  // (mismo vencimiento), pero cada uno una sola vez.
  return new Set((data || []).map((r) => `${r.alumno_id}|${r.vencimiento}|${r.tipo}`))
}

async function logMensaje(row) {
  const { error } = await supabaseAdmin.from('whatsapp_mensajes').insert(row)
  if (error) console.warn('[wa-log] insert error:', error.message)
}

export async function procesarRecordatorios(gymId, { simulate = false } = {}) {
  const cfg = await getGymConfig(gymId)
  if (!cfg.moduleEnabled) {
    return { gym_id: gymId, status: 'module_disabled', sent: 0, errors: 0 }
  }
  if (!cfg.gym.whatsapp_enabled) {
    return { gym_id: gymId, status: 'disabled', sent: 0, errors: 0 }
  }

  if (!simulate && !whatsappManager.isConnected(gymId)) {
    // El módulo está habilitado pero el socket no está conectado: los recordatorios
    // NO se envían. Antes fallaba mudo (así estuvimos días caídos sin enterarnos).
    const waStatus = whatsappManager.getState(gymId)?.status ?? 'none'
    notifyWaDown(gymId, 'not_connected', `status=${waStatus}`).catch(() => {})
    return {
      gym_id: gymId,
      status: 'not_connected',
      sent: 0,
      errors: 0,
      message: 'WhatsApp no conectado para este gym'
    }
  }

  const alumnos = await fetchAlumnosToRemind(gymId, cfg.daysBefore)

  // Dedupe: si ya se envió pa ese alumno+vencimiento, saltar.
  // Aplica TAMBIÉN en simulate: la vista previa muestra solo lo que se mandaría
  // ahora (alumnos nuevos), nunca lo ya enviado en corridas previas.
  const sentSet = await fetchAlreadySent(
    gymId,
    alumnos.map((a) => a.id),
    alumnos.map((a) => a.fecha_de_vencimiento)
  )

  let sent = 0
  let errors = 0
  let skipped = 0
  let pending = 0
  const results = []
  const today = dayjs().startOf('day')

  for (const a of alumnos) {
    const venc = dayjs(a.fecha_de_vencimiento).startOf('day')
    const diffDays = venc.diff(today, 'day')
    // Aviso del día de vencimiento vs aviso previo (N días antes).
    const tipo = diffDays <= 0 ? 'recordatorio_vencimiento' : 'recordatorio_previo'
    const dedupeKey = `${a.id}|${a.fecha_de_vencimiento}|${tipo}`
    if (sentSet.has(dedupeKey)) {
      skipped++
      results.push({ alumno_id: a.id, status: 'already_sent' })
      continue
    }

    const planNombre = a.planes_precios?.nombre || ''
    const fecha = venc.format('D/M/YYYY')
    const estado = diffDays < 0 ? 'venció' : (diffDays === 0 ? 'vence hoy' : 'vence')
    const text = fmt(cfg.template, { nombre: a.nombre, plan: planNombre, fecha, estado })
    const jid = whatsappManager.buildJid(a.telefono, cfg.countryPrefix)

    if (!jid) {
      errors++
      results.push({ alumno_id: a.id, status: 'invalid_phone' })
      continue
    }

    if (simulate) {
      pending++
      results.push({ alumno_id: a.id, jid, text, status: 'simulated' })
      continue
    }

    try {
      await whatsappManager.sendText(gymId, jid, text)
      sent++
      await logMensaje({
        gym_id: gymId,
        alumno_id: a.id,
        telefono: a.telefono,
        nombre: a.nombre,
        plan: planNombre,
        vencimiento: a.fecha_de_vencimiento,
        mensaje: text,
        tipo,
        estado: 'enviado'
      })
      results.push({ alumno_id: a.id, status: 'sent' })
    } catch (e) {
      errors++
      await logMensaje({
        gym_id: gymId,
        alumno_id: a.id,
        telefono: a.telefono,
        nombre: a.nombre,
        plan: planNombre,
        vencimiento: a.fecha_de_vencimiento,
        mensaje: text,
        tipo,
        estado: 'error',
        error_msg: e.message
      })
      results.push({ alumno_id: a.id, status: 'error', error: e.message })
    }

    await sleep(cfg.delayMs)
  }

  return { gym_id: gymId, gym_name: cfg.gym.name ?? null, admin_jid: cfg.adminJid, status: 'ok', sent, errors, skipped, pending, total: alumnos.length, results }
}

export async function triggerAllGyms({ simulate = false } = {}) {
  const { data, error } = await supabaseAdmin
    .from('gyms')
    .select('id,settings,whatsapp_enabled')
    .eq('whatsapp_enabled', true)
    .is('deleted_at', null)
  if (error) throw error

  const eligibles = (data || []).filter((g) => !!g.settings?.whatsapp_module_enabled)

  const out = []
  for (const g of eligibles) {
    try {
      out.push(await procesarRecordatorios(g.id, { simulate }))
    } catch (e) {
      out.push({ gym_id: g.id, status: 'error', error: e.message })
    }
  }
  return out
}

export async function ensureConnectedGyms() {
  const { data, error } = await supabaseAdmin
    .from('gyms')
    .select('id,settings')
    .eq('whatsapp_enabled', true)
    .is('deleted_at', null)
  if (error) throw error

  const eligibles = (data || []).filter((g) => !!g.settings?.whatsapp_module_enabled)

  for (const g of eligibles) {
    try {
      // probe: ¿hay creds guardadas?
      const { data: row } = await supabaseAdmin
        .from('whatsapp_session')
        .select('id')
        .eq('gym_id', g.id)
        .eq('id', 'creds')
        .maybeSingle()
      if (row) {
        whatsappManager.connect(g.id).catch((e) =>
          console.warn(`[wa boot ${g.id}] connect failed:`, e.message)
        )
      }
    } catch (e) {
      console.warn(`[wa boot ${g.id}] probe error:`, e.message)
    }
  }
}
