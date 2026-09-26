import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import { supabaseAdmin } from '../../config/supabaseClient.js'
import { fetchAllPaged } from '../../utilities/fetchAllPaged.js'

dayjs.extend(utc)
dayjs.extend(timezone)

// Acceso a la tabla cola_envios. Cada fila es UN mensaje (WhatsApp o email):
// los endpoints del cron solo encolan y el worker (worker.js) los envía.
// Estados: pendiente -> enviando -> enviado | error ; o cancelado | vencido.

const TZ = 'America/Argentina/Buenos_Aires'

/** Fin del día de hoy en Argentina: los avisos "vence hoy" no sirven mañana. */
export function finDelDiaArgentina() {
  return dayjs().tz(TZ).endOf('day').toISOString()
}

function inicioDelDiaArgentina() {
  return dayjs().tz(TZ).startOf('day').toISOString()
}

/**
 * Encola mensajes. Los que ya existen (misma dedupe_key) se ignoran: si el cron
 * dispara dos veces, nadie recibe el aviso repetido.
 * @param {Array<{canal:'whatsapp'|'email', gym_id:string, alumno_id?:number|null, destinatario:string, payload:object, dedupe_key:string, vence_at?:string}>} filas
 * @returns {Promise<{encolados:number, repetidos:number}>}
 */
export async function encolar(filas) {
  if (!filas.length) return { encolados: 0, repetidos: 0 }
  const venceAt = finDelDiaArgentina()
  let encolados = 0
  for (let i = 0; i < filas.length; i += 500) {
    const lote = filas.slice(i, i + 500).map((f) => ({ vence_at: venceAt, ...f }))
    const { data, error } = await supabaseAdmin
      .from('cola_envios')
      .upsert(lote, { onConflict: 'dedupe_key', ignoreDuplicates: true })
      .select('id')
    if (error) throw error
    encolados += data?.length ?? 0
  }
  return { encolados, repetidos: filas.length - encolados }
}

/** Claves que ya están en la cola (cualquier estado), para no mostrarlas en la simulación. */
export async function clavesYaEncoladas(claves) {
  const out = new Set()
  for (let i = 0; i < claves.length; i += 200) {
    const { data, error } = await supabaseAdmin
      .from('cola_envios')
      .select('dedupe_key')
      .in('dedupe_key', claves.slice(i, i + 200))
    if (error) throw error
    for (const r of data ?? []) out.add(r.dedupe_key)
  }
  return out
}

/** Toma el próximo pendiente y lo marca 'enviando' (RPC con SKIP LOCKED). */
export async function tomarEnvio(canal, gymId = null) {
  const { data, error } = await supabaseAdmin.rpc('tomar_envio', { p_canal: canal, p_gym_id: gymId })
  if (error) throw error
  return data?.[0] ?? null
}

export async function marcarEnviado(id) {
  const { error } = await supabaseAdmin
    .from('cola_envios')
    .update({ estado: 'enviado', procesado_at: new Date().toISOString(), error_msg: null })
    .eq('id', id)
  if (error) throw error
}

export async function marcarError(id, mensaje) {
  const { error } = await supabaseAdmin
    .from('cola_envios')
    .update({ estado: 'error', procesado_at: new Date().toISOString(), error_msg: mensaje })
    .eq('id', id)
  if (error) throw error
}

/** Devuelve a la cola un envío que falló sin salir (ej. Brevo rechazó el request). */
export async function volverAPendiente(id, mensaje) {
  const { error } = await supabaseAdmin
    .from('cola_envios')
    .update({ estado: 'pendiente', error_msg: mensaje, tomado_at: null })
    .eq('id', id)
  if (error) throw error
}

/** Pasa a 'cancelado' los pendientes (de un gym o de todos). Devuelve cuántos. */
export async function cancelarPendientes({ canal = 'whatsapp', gymId = null, motivo }) {
  let q = supabaseAdmin
    .from('cola_envios')
    .update({ estado: 'cancelado', procesado_at: new Date().toISOString(), error_msg: motivo })
    .eq('estado', 'pendiente')
    .eq('canal', canal)
  if (gymId) q = q.eq('gym_id', gymId)
  const { data, error } = await q.select('gym_id')
  if (error) throw error
  return data ?? []
}

/** Gyms que tienen mensajes pendientes en un canal. */
export async function gymsConPendientes(canal) {
  const { data, error } = await supabaseAdmin
    .from('cola_envios')
    .select('gym_id')
    .eq('estado', 'pendiente')
    .eq('canal', canal)
    .gt('vence_at', new Date().toISOString())
    .limit(1000)
  if (error) throw error
  return [...new Set((data ?? []).map((r) => r.gym_id))]
}

export async function hayPendientes(canal) {
  const { count, error } = await supabaseAdmin
    .from('cola_envios')
    .select('id', { count: 'exact', head: true })
    .eq('estado', 'pendiente')
    .eq('canal', canal)
  if (error) throw error
  return (count ?? 0) > 0
}

/** Vence pendientes viejos, marca interrumpidos (sin reintento) y limpia historial. */
export async function mantenimiento() {
  const { data, error } = await supabaseAdmin.rpc('mantenimiento_cola_envios')
  if (error) throw error
  return data
}

/**
 * Progreso de los envíos de WhatsApp de hoy, por gym (lo muestra el panel).
 * `activo` = todavía le quedan mensajes pendientes o saliendo.
 */
export async function progresoDeHoy({ gymId = null } = {}) {
  const filas = await fetchAllPaged(() => {
    let q = supabaseAdmin
      .from('cola_envios')
      .select('id, gym_id, estado, created_at, gyms:gym_id(name)')
      .eq('canal', 'whatsapp')
      .gte('created_at', inicioDelDiaArgentina())
    if (gymId) q = q.eq('gym_id', gymId)
    return q.order('id')
  })

  const porGym = new Map()
  for (const f of filas) {
    if (!porGym.has(f.gym_id)) {
      porGym.set(f.gym_id, {
        gym_id: f.gym_id,
        gym_name: f.gyms?.name ?? null,
        total: 0,
        sent: 0,
        errors: 0,
        cancelados: 0,
        vencidos: 0,
        restantes: 0,
        desde: f.created_at,
      })
    }
    const g = porGym.get(f.gym_id)
    g.total += 1
    if (f.estado === 'enviado') g.sent += 1
    else if (f.estado === 'error') g.errors += 1
    else if (f.estado === 'cancelado') g.cancelados += 1
    else if (f.estado === 'vencido') g.vencidos += 1
    else g.restantes += 1 // pendiente | enviando
  }

  return [...porGym.values()].map((g) => ({
    ...g,
    activo: g.restantes > 0,
    segundos: Math.round((Date.now() - new Date(g.desde).getTime()) / 1000),
  }))
}
