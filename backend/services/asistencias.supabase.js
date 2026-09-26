import { supabase, supabaseAdmin } from '../config/supabaseClient.js'

// Paginado: el historial de asistencias crece todos los días y traerlo entero
// se cortaba en 1000 filas (HerGym ya pasa las 20.000).
export async function getAsistenciasPaged(gymId, { page = 1, limit = 100, fecha = null } = {}) {
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabaseAdmin
    .from('asistencias')
    .select('*', { count: 'exact' })
    .eq('gym_id', gymId)
  if (fecha) query = query.eq('fecha', fecha)

  const { data, error, count } = await query
    .order('fecha', { ascending: false })
    .order('hora', { ascending: false })
    .order('id', { ascending: false })
    .range(from, to)
  if (error) throw error
  return { items: data ?? [], total: count ?? 0, page, limit }
}

export async function createAsistencia(supa, asistencia, gymId) {
  const dniRaw = asistencia?.dni ?? asistencia?.DNI
  if (!dniRaw) throw new Error('Falta DNI')
  const dni = String(dniRaw).trim()

  const { data, error } = await supa.rpc('registrar_asistencia', {
    p_dni: dni,
    p_gym_id: gymId,
  })

  if (error) {
    if (error.code === 'GYM02') {
      let detail = {}
      try { detail = JSON.parse(error.details) } catch { /* noop */ }
      const err = new Error('El alumno ya registró asistencia hoy')
      err.code = 'ALREADY_CHECKED_IN'
      err.hora = detail.hora
      err.nombre = detail.nombre
      throw err
    }
    throw new Error(error.message)
  }

  return data
}

export async function getAsistenciaById(id, gymId) {
  const { data, error } = await supabaseAdmin
    .from('asistencias')
    .select('*')
    .match({ id, gym_id: gymId })
    .single()
  if (error) throw error
  return data
}

export async function deleteAsistencia(id, gymId) {
  const { data, error } = await supabaseAdmin
    .from('asistencias')
    .delete()
    .match({ id, gym_id: gymId })
    .single()
  if (error) throw error
  return data
}
