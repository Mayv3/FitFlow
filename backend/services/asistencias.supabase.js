import { supabase, supabaseAdmin } from '../config/supabaseClient.js'

export async function getAllAsistencias(gymId) {
  const { data, error } = await supabaseAdmin
    .from('asistencias')
    .select('*')
    .eq('gym_id', gymId)
    .order('fecha', { ascending: false })
    .order('hora', { ascending: false })
  if (error) throw error
  return data
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
