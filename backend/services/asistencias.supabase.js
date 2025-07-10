import { supabase } from '../db/supabaseClient.js'

export async function getAllAsistencias(gymId) {
  const { data, error } = await supabase
    .from('asistencias')
    .select('*')
    .eq('gym_id', gymId)
    .order('fecha', { ascending: false })
    .order('hora', { ascending: false })
  if (error) throw error
  return data
}

export async function createAsistencia(asistencia, gymId) {
  const payload = {
    fecha: asistencia.Fecha,
    hora:  asistencia.Hora,
    alumno_dni: asistencia.DNI,
    plan_id: asistencia.Plan,
    gym_id: gymId
  }

  const { data, error } = await supabase
    .from('asistencias')
    .insert(payload)
    .single()
  if (error) throw error
  return data
}

export async function getAsistenciaById(id, gymId) {
  const { data, error } = await supabase
    .from('asistencias')
    .select('*')
    .match({ id, gym_id: gymId })
    .single()
  if (error) throw error
  return data
}

export async function deleteAsistencia(id, gymId) {
  const { data, error } = await supabase
    .from('asistencias')
    .delete()
    .match({ id, gym_id: gymId })
    .single()
  if (error) throw error
  return data
}
