import { supabase, supabaseAdmin } from '../db/supabaseClient.js'

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
  // 1️⃣ Buscar si ya existe activo
  const { data: activo, error: eActivo } = await supaClient
    .from('alumnos')
    .select('*')
    .eq('dni', alumno.dni)
    .is('deleted_at', null)
    .maybeSingle();

  if (eActivo) throw eActivo;
  if (activo) return activo;

  // 2️⃣ Buscar eliminado (usa admin para saltar RLS)
  const { data: eliminado, error: eEliminado } = await supabaseAdmin
    .from('alumnos')
    .select('id')
    .eq('dni', alumno.dni)
    .eq('gym_id', alumno.gym_id)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (eEliminado) throw eEliminado;

  // 3️⃣ Revivir si existía
  if (eliminado) {
    const { data: reactivado, error: eUpd } = await supabaseAdmin
      .from('alumnos')
      .update({ ...alumno, deleted_at: null })
      .eq('id', eliminado.id)
      .select('*')
      .single();

    if (eUpd) throw eUpd;
    return reactivado;
  }

  // 4️⃣ Si no existía, crear
  const { data: creado, error: eIns } = await supaClient
    .from('alumnos')
    .insert(alumno)
    .select('*')
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
  const dniValue = Number(dni); // asegura tipo numérico

  const { data: before, error: e1 } = await supaClient
    .from('alumnos')
    .select(`
      id, dni, nombre, email, telefono,
      fecha_nacimiento, fecha_inicio, fecha_de_vencimiento,
      clases_pagadas, clases_realizadas, sexo,
      gym_id, plan_id,
      plan:planes_precios ( id, nombre )
    `)
    .eq('dni', dniValue)
    .is('deleted_at', null)
    .maybeSingle();

  if (e1) throw e1;
  if (!before) throw new Error('Alumno no encontrado o ya eliminado');

  const { error: e2 } = await supabaseAdmin
    .from('alumnos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', before.id);

  if (e2) throw e2;

  return { before };
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