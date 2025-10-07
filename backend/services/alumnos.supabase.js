import { supabase } from '../db/supabaseClient.js'

export async function getAllAlumnos() {
  const { data, error } = await supa
    .from('alumnos')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getAlumnoByDNI(dni, supaClient) {

  const { data, error } = await supaClient
    .from('alumnos')
    .select(`
      id, dni, nombre, email, telefono,
      fecha_nacimiento, fecha_inicio, fecha_de_vencimiento,
      clases_pagadas, clases_realizadas, sexo,
      gym_id, plan_id
    `)
    .eq('dni', dni)
    .is('deleted_at', null)
    .maybeSingle();


  if (error) throw error;
  return data;
}

export async function createAlumno(alumno, supaClient) {
  const { data: activo } = await supaClient
    .from('alumnos')
    .select('id, dni, gym_id, plan_id, fecha_de_vencimiento, deleted_at, nombre, email, telefono, fecha_nacimiento, fecha_inicio, clases_pagadas, clases_realizadas')
    .eq('dni', alumno.dni)
    .is('deleted_at', null)
    .single();

  if (activo) return activo;

  const { data: eliminado } = await supaClient
    .from('alumnos')
    .select('id, dni, gym_id, plan_id, fecha_de_vencimiento, deleted_at, nombre, email, telefono, fecha_nacimiento, fecha_inicio, clases_pagadas, clases_realizadas')
    .eq('dni', alumno.dni)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
    .limit(1)
    .single();

  if (eliminado) {
    const { data: reactivado, error: eUpd } = await supaClient
      .from('alumnos')
      .update({ deleted_at: null })
      .eq('id', eliminado.id)
      .select('id, dni, gym_id, plan_id, fecha_de_vencimiento, deleted_at, nombre, email, telefono, fecha_nacimiento, fecha_inicio, clases_pagadas, clases_realizadas')
      .single();
    if (eUpd) throw eUpd;
    return reactivado;
  }

  const { data: creado, error: eIns } = await supaClient
    .from('alumnos')
    .insert(alumno) // sin gym_id manual
    .select('id, dni, gym_id, plan_id, fecha_de_vencimiento, deleted_at, nombre, email, telefono, fecha_nacimiento, fecha_inicio, clases_pagadas, clases_realizadas')
    .single();

  if (eIns) throw eIns;
  return creado;
}

export async function updateAlumno(dni, nuevosDatos, supaClient) {
  const { data, error } = await supaClient
    .from('alumnos')
    .update(nuevosDatos)
    .eq('dni', dni)
    .select(`
      id, dni, nombre, email, telefono,
      fecha_nacimiento, fecha_inicio, fecha_de_vencimiento,
      clases_pagadas, clases_realizadas, sexo,
      gym_id, plan_id,
      plan:planes_precios ( id, nombre )
    `)
    .single();

  if (error) throw error;

  return {
    ...data,
    plan_nombre: data?.plan?.nombre ?? null,
    plan_id: data?.plan?.id ?? null,
  };
}

export async function deleteAlumno(dni, supaClient) {
  const { data: before, error: e1 } = await supaClient
    .from('alumnos')
    .select('id, dni, gym_id, plan_id, fecha_de_vencimiento')
    .eq('dni', dni)
    .is('deleted_at', null)
    .single();

  if (e1 || !before) throw new Error('Alumno no encontrado o ya eliminado');

  // Soft delete
  const { data: after, error: e2 } = await supaClient
    .from('alumnos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', before.id)
    .select('id, dni, gym_id, plan_id, fecha_de_vencimiento')
    .single();

  if (e2) throw e2;

  return { before, after };
}

export async function getAlumnosService({ page, limit, q = '' }, supaClient) {
  const offset = (page - 1) * limit;

  let query = supaClient
    .from('alumnos')
    .select(`
      id, dni, nombre, email, telefono,
      fecha_nacimiento, fecha_inicio, fecha_de_vencimiento,
      clases_pagadas, clases_realizadas, sexo,
      gym_id, plan_id,
      plan:planes_precios ( id, nombre )
    `, { count: 'exact' })
    .is('deleted_at', null);

  if (q.trim()) {
    const like = `%${q}%`;
    query = query.or([
      `dni.ilike.${like}`,
      `nombre.ilike.${like}`,
      `email.ilike.${like}`,
      `telefono.ilike.${like}`,
    ].join(','));
  }

  const { data, count, error } = await query
    .order('id', { ascending: false })
    .range(offset, offset + limit - 1);


  if (error) throw error;

  const items = (data ?? []).map(r => ({
    ...r,
    plan_nombre: r.plan?.nombre ?? null,
    plan_id: r.plan?.id ?? null,
  }));

  return {
    items,
    total: count ?? 0,
    page,
    limit,
    q,
  };
}

export async function getAlumnosSimpleService(supaClient) {
  const { data, error } = await supaClient
    .from('alumnos')
    .select('id, nombre, dni, email')
    .is('deleted_at', null)
    .order('nombre', { ascending: true });

  if (error) throw error;
  return data;
}