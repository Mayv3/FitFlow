import { supabase } from '../db/supabaseClient.js'

export async function getAllAlumnos() {
  const { data, error } = await supabase
    .from('alumnos')
    .select('*')
    .order('nombre', { ascending: true })
  if (error) throw error
  return data
}

export async function getAlumnoByDNI(dni) {
  const { data, error } = await supabase
    .from('alumnos')
    .select('*')
    .eq('dni', dni)
    .single();
  if (error) throw error
  return data
}

export async function createAlumno(alumno) {
  console.log(alumno)
  const { data, error } = await supabase
    .from('alumnos')
    .insert(alumno)
    .single()
  if (error) throw error
  return data
}

export async function updateAlumno(dni, nuevosDatos) {
  const { data, error } = await supabase
    .from('alumnos')
    .update(nuevosDatos)
    .eq('dni', dni)
    .single()
  if (error) throw error
  return data
}

export async function deleteAlumno(dni) {
  const { data, error } = await supabase
    .from('alumnos')
    .delete()
    .eq('dni', dni)
    .single()
  if (error) throw error
  return data
}