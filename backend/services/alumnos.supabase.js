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

export async function getAlumnosService({ gymId, page, limit, q = '' }) {
  const offset = (page - 1) * limit;

  let query = supabase
    .from('alumnos')
    .select('*', { count: 'exact' })
    .eq('gym_id', gymId);

  if (q.trim()) {
    const like = `*${q.trim()}*`;
    query = query.or(
      [
        `dni.ilike.${like}`,
        `nombre.ilike.${like}`,
        `email.ilike.${like}`,
        `telefono.ilike.${like}`,
      ].join(',')
    );
  }

  const { data, count, error } = await query
    .order('id', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return {
    items: data ?? [],
    total: count ?? 0,
    page,
    limit,
    q,
  };
}

