import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import { supabaseAdmin } from '../../config/supabaseClient.js'
import { whatsappManager } from './WhatsappManager.js'
import { waLog, rememberGymName, duracion } from './logger.js'
import {
  encolar,
  clavesYaEncoladas,
  cancelarPendientes,
  progresoDeHoy,
} from '../cola/colaEnvios.js'

dayjs.extend(utc)
dayjs.extend(timezone)

const TZ = 'America/Argentina/Buenos_Aires'

const DEFAULT_TEMPLATE =
  'Hola {nombre}, tu plan {plan} {estado} el {fecha}. ¡Renoválo para seguir entrenando! 💪'

function fmt(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')
}

// Los recordatorios ya no se envían acá: se calculan y se ENCOLAN en
// cola_envios, y el worker (services/cola/worker.js) los manda con las pausas
// anti-spam. Así el cron responde en segundos, un deploy a mitad de camino no
// pierde los que faltaban y un segundo disparo no duplica avisos.

export async function getGymConfig(gymId) {
  const { data, error } = await supabaseAdmin
    .from('gyms')
    .select('id,name,settings,whatsapp_enabled')
    .eq('id', gymId)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error(`gym ${gymId} not found`)
  rememberGymName(gymId, data.name) // los logs de acá en más salen con nombre
  const wa = data.settings?.whatsapp || {}
  return {
    gym: data,
    moduleEnabled: !!data.settings?.whatsapp_module_enabled,
    countryPrefix: wa.country_prefix || '549',
    daysBefore: Number.isFinite(wa.reminder_days_before) ? wa.reminder_days_before : 3,
    template: wa.template || DEFAULT_TEMPLATE,
    adminJid: wa.admin_jid || null
  }
}

function hoyArgentina() {
  return dayjs().tz(TZ).startOf('day')
}

async function fetchAlumnosToRemind(gymId) {
  // Recordatorio previo deshabilitado por ahora — solo se avisa el día que vence.
  // (para reactivar, sumar hoy + daysBefore a dueDays)
  const dueDays = [hoyArgentina().format('YYYY-MM-DD')]

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

// Avisos ya enviados (whatsapp_mensajes). Sigue haciendo falta además de la
// dedupe de la cola: cubre lo enviado antes de que existiera la cola.
async function fetchAlreadySent(gymId, alumnoIds, vencimientos) {
  if (!alumnoIds.length) return new Set()
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
    waLog(gymId, 'No pude leer qué alumnos ya fueron avisados', {
      level: 'warn',
      detalle: {
        Error: error.message,
        'Qué implica': 'Sin dedupe contra el historial; la cola igual evita repetir lo encolado hoy.'
      }
    })
    return new Set()
  }
  return new Set((data || []).map((r) => `${r.alumno_id}|${r.vencimiento}|${r.tipo}`))
}

/**
 * Calcula los recordatorios de hoy para un gym.
 * - simulate: devuelve a quién se le mandaría (sin encolar nada).
 * - real: los encola en cola_envios; el worker los envía.
 */
export async function procesarRecordatorios(gymId, { simulate = false } = {}) {
  const cfg = await getGymConfig(gymId)
  if (!cfg.moduleEnabled) {
    waLog(gymId, 'Corrida salteada: el módulo de WhatsApp está apagado para este gym', {
      detalle: { 'Dónde se prende': 'gyms.settings.whatsapp_module_enabled' }
    })
    return { gym_id: gymId, status: 'module_disabled', sent: 0, errors: 0 }
  }
  if (!cfg.gym.whatsapp_enabled) {
    waLog(gymId, 'Corrida salteada: los envíos están pausados para este gym', {
      detalle: { 'Dónde se prende': 'gyms.whatsapp_enabled' }
    })
    return { gym_id: gymId, status: 'disabled', sent: 0, errors: 0 }
  }

  const conectado = whatsappManager.isConnected(gymId)
  if (!simulate && !conectado) {
    // Sin alerta por mail acá: la manda el worker si sigue caído >5 min con
    // mensajes esperando (justo después de un deploy los sockets tardan en volver).
    const waStatus = whatsappManager.getState(gymId)?.status ?? 'none'
    waLog(gymId, 'WhatsApp no está conectado: los recordatorios quedan en cola hasta que se reconecte', {
      level: 'warn',
      detalle: {
        Estado: waStatus,
        'Qué pasa': 'Se envían solos cuando vuelva la conexión. Si no vuelve hoy, vencen a medianoche.',
      }
    })
  }

  const alumnos = await fetchAlumnosToRemind(gymId)
  const sentSet = await fetchAlreadySent(
    gymId,
    alumnos.map((a) => a.id),
    alumnos.map((a) => a.fecha_de_vencimiento)
  )

  const today = hoyArgentina()
  const results = []
  const candidatos = []
  let errors = 0
  let skipped = 0

  for (const a of alumnos) {
    const venc = dayjs.tz(a.fecha_de_vencimiento, TZ).startOf('day')
    const diffDays = venc.diff(today, 'day')
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
      waLog(gymId, `Teléfono inválido — ${a.nombre}`, {
        level: 'warn',
        detalle: { 'Guardado en la ficha': a.telefono, 'Qué hago': 'Salteo este alumno.' }
      })
      results.push({ alumno_id: a.id, status: 'invalid_phone' })
      continue
    }

    candidatos.push({
      alumno: a,
      jid,
      text,
      tipo,
      planNombre,
      colaKey: `whatsapp|${gymId}|${dedupeKey}`,
    })
  }

  // Lo que ya está en la cola (enviado por ella o todavía saliendo) tampoco va.
  const yaEncolados = await clavesYaEncoladas(candidatos.map((c) => c.colaKey))
  const nuevos = []
  for (const c of candidatos) {
    if (yaEncolados.has(c.colaKey)) {
      skipped++
      results.push({ alumno_id: c.alumno.id, status: 'already_queued' })
    } else {
      nuevos.push(c)
    }
  }

  if (simulate) {
    for (const c of nuevos) {
      results.push({ alumno_id: c.alumno.id, jid: c.jid, text: c.text, status: 'simulated' })
    }
    waLog(gymId, 'Simulación de recordatorios', {
      detalle: { 'A enviar': nuevos.length, 'Ya avisados o en cola': skipped, 'Teléfonos inválidos': errors }
    })
    return {
      gym_id: gymId,
      gym_name: cfg.gym.name ?? null,
      admin_jid: cfg.adminJid,
      status: 'ok',
      sent: 0,
      errors,
      skipped,
      pending: nuevos.length,
      total: alumnos.length,
      results
    }
  }

  const { encolados, repetidos } = await encolar(
    nuevos.map((c) => ({
      canal: 'whatsapp',
      gym_id: gymId,
      alumno_id: c.alumno.id,
      destinatario: c.jid,
      dedupe_key: c.colaKey,
      payload: {
        text: c.text,
        telefono: c.alumno.telefono,
        nombre: c.alumno.nombre,
        plan: c.planNombre,
        vencimiento: c.alumno.fecha_de_vencimiento,
        tipo: c.tipo,
        remitente_jid: cfg.adminJid,
      },
    }))
  )
  for (const c of nuevos) results.push({ alumno_id: c.alumno.id, status: 'queued' })

  const tandas = Math.floor(Math.max(0, encolados - 1) / 25)
  waLog(gymId, 'Recordatorios encolados', {
    level: 'start',
    detalle: {
      Encolados: encolados,
      'Ya avisados o en cola': skipped + repetidos,
      'Teléfonos inválidos': errors || undefined,
      WhatsApp: conectado ? 'conectado' : 'NO conectado (esperan en cola)',
      'Tiempo estimado': encolados ? `~${duracion(encolados * 9000 + tandas * 90000)}` : '—',
    }
  })

  return {
    gym_id: gymId,
    gym_name: cfg.gym.name ?? null,
    admin_jid: cfg.adminJid,
    status: conectado ? 'queued' : 'queued_not_connected',
    queued: encolados,
    sent: 0,
    errors,
    skipped: skipped + repetidos,
    total: alumnos.length,
    results
  }
}

export async function triggerAllGyms({ simulate = false } = {}) {
  const { data, error } = await supabaseAdmin
    .from('gyms')
    .select('id,settings,whatsapp_enabled')
    .eq('whatsapp_enabled', true)
    .is('deleted_at', null)
  if (error) throw error

  const eligibles = (data || []).filter((g) => !!g.settings?.whatsapp_module_enabled)

  waLog(null, `===== ${simulate ? 'SIMULACIÓN' : 'ENCOLADO'} de recordatorios: ${eligibles.length} gimnasios =====`, {
    level: 'start'
  })

  const out = await Promise.all(
    eligibles.map(async (g) => {
      try {
        return await procesarRecordatorios(g.id, { simulate })
      } catch (e) {
        waLog(g.id, 'No pude calcular los recordatorios de este gym', {
          level: 'error',
          detalle: { Error: e.message, 'Qué hago': 'Sigo con el resto de los gimnasios.' }
        })
        return { gym_id: g.id, status: 'error', error: e.message }
      }
    })
  )

  if (!simulate) {
    waLog(null, `===== ${out.reduce((s, r) => s + (r.queued || 0), 0)} recordatorios encolados =====`, {
      level: 'end'
    })
  }
  return out
}

// ── Cancelación y progreso (leídos de la cola, sobreviven a reinicios) ───────

/**
 * Cancela los recordatorios pendientes de un gym. Los ya enviados no se deshacen.
 * @returns {Promise<{ok:boolean, sent:number, restantes:number}|null>} null si no había nada pendiente
 */
export async function cancelarEnvio(gymId, porQuien = 'desconocido') {
  const cancelados = await cancelarPendientes({ gymId, motivo: `Cancelado a mano por ${porQuien}` })
  if (!cancelados.length) return null
  const [prog] = await progresoDeHoy({ gymId })
  waLog(gymId, 'CANCELACIÓN — los pendientes no se van a enviar', {
    level: 'warn',
    detalle: {
      Pedido: `por ${porQuien}`,
      'Ya enviados hoy': `${prog?.sent ?? 0} (esos no se pueden deshacer)`,
      Cancelados: cancelados.length
    }
  })
  return { ok: true, sent: prog?.sent ?? 0, restantes: cancelados.length }
}

/** Cancela los pendientes de todos los gimnasios. */
export async function cancelarTodo(porQuien = 'desconocido') {
  const cancelados = await cancelarPendientes({ motivo: `Cancelado a mano por ${porQuien}` })
  if (!cancelados.length) {
    waLog(null, 'Pedido de cancelación pero no había ningún envío pendiente', { level: 'warn' })
    return []
  }
  const porGym = new Map()
  for (const c of cancelados) porGym.set(c.gym_id, (porGym.get(c.gym_id) ?? 0) + 1)
  const progreso = new Map((await progresoDeHoy()).map((p) => [p.gym_id, p]))
  const frenadas = [...porGym.entries()].map(([gymId, restantes]) => ({
    gym_id: gymId,
    ok: true,
    sent: progreso.get(gymId)?.sent ?? 0,
    restantes,
  }))
  waLog(null, `CANCELACIÓN de todos los envíos pendientes (${cancelados.length} mensajes)`, {
    level: 'warn',
    detalle: { Pedido: `por ${porQuien}` }
  })
  return frenadas
}

/** Envíos de WhatsApp de hoy por gym, para que el panel muestre el progreso. */
export async function estadoCorridas({ gymId = null } = {}) {
  const progreso = await progresoDeHoy({ gymId })
  return progreso.map((p) => ({
    gym_id: p.gym_id,
    gym_name: p.gym_name,
    simulate: false,
    total: p.total,
    sent: p.sent,
    errors: p.errors,
    skipped: 0,
    cancelados: p.cancelados,
    vencidos: p.vencidos,
    restantes: p.restantes,
    cancelada: p.cancelados > 0,
    activo: p.activo,
    segundos: p.segundos,
  }))
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
          waLog(g.id, 'Falló la reconexión automática al arrancar el server', {
            level: 'error',
            detalle: { Error: e.message }
          })
        )
      } else {
        waLog(g.id, 'Sin credenciales guardadas — no reconecto', {
          detalle: { 'Qué hacer': 'Escanear el QR desde el panel del gym.' }
        })
      }
    } catch (e) {
      waLog(g.id, 'No pude verificar si hay credenciales guardadas', {
        level: 'warn',
        detalle: { Error: e.message }
      })
    }
  }
}
