import { supabase, supabaseAdmin } from '../config/supabaseClient.js'
import { fetchAllPaged } from '../utilities/fetchAllPaged.js'
import { fechaArgentina } from '../utilities/moment.js'

const SIMPLE_LIMIT_DEFAULT = 20
const SIMPLE_LIMIT_MAX = 50

// El texto buscado va dentro de un .or() de PostgREST: `,` `(` `)` `"` y `\`
// rompen esa sintaxis (ej. buscar "Pérez, Juan" tiraba error 500).
function limpiarBusqueda(q) {
  return String(q ?? '').replace(/[(),"\\]/g, ' ').replace(/\s+/g, ' ').trim()
}

// El conteo se hace con GROUP BY en la DB (RPC active_alumnos_count_by_gym):
// traer las filas para contarlas en JS se cortaba en 1000 sin avisar.
export async function getActiveAlumnosCountByGym() {
  const { data, error } = await supabaseAdmin.rpc('active_alumnos_count_by_gym', {
    p_today: fechaArgentina(),
  });

  if (error) throw error;

  const counts = {};
  for (const row of data ?? []) {
    counts[row.gym_id] = Number(row.total);
  }
  return counts;
}

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

export async function getAlumnoById(id) {
  const { data, error } = await supabase
    .from('alumnos')
    .select('id, nombre, dni, email')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error(`[getAlumnoById] Error obteniendo alumno:`, error);
    throw error;
  }

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
      clases_pagadas, clases_realizadas, sexo, origen,
      gym_id, plan_id,
      plan:planes_precios ( id, nombre )
    `, { count: 'exact' })
    .is('deleted_at', null);

  const s = limpiarBusqueda(q);
  if (s) {
    const like = `%${s}%`;
    query = query.or([
      `dni.ilike.${like}`,
      `nombre.ilike.${like}`,
      `email.ilike.${like}`,
      `telefono.ilike.${like}`,
    ].join(','));
  }

  const { data, count, error } = await query
    .order('nombre', { ascending: true })
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

export async function getExpiredAlumnosService(supaClient) {
  const today = fechaArgentina();

  const data = await fetchAllPaged(() =>
    supaClient
      .from('alumnos')
      .select(`
        id, dni, nombre, email, telefono,
        fecha_de_vencimiento, plan_id,
        plan:planes_precios ( id, nombre, precio )
      `)
      .is('deleted_at', null)
      .lt('fecha_de_vencimiento', today)
      .order('fecha_de_vencimiento', { ascending: false })
      .order('id')
  );

  return data.map(r => ({
    ...r,
    plan_nombre: r.plan?.nombre ?? null,
    plan_precio: r.plan?.precio ?? null,
    plan_id: r.plan?.id ?? null,
  }));
}

/**
 * Alumnos para los selects (pagos, turnos, inscripciones). Ya no baja la
 * lista entera del gym: busca por nombre o DNI y devuelve como mucho `limit`.
 * - `ids`: resuelve alumnos puntuales (el valor ya elegido al editar). Incluye
 *   eliminados para que un pago viejo siga mostrando el nombre.
 * - `q` vacío: los primeros `limit` por orden alfabético.
 */
export async function getAlumnosSimpleService(supaClient, { q = '', ids = [], limit = SIMPLE_LIMIT_DEFAULT } = {}) {
  let query = supaClient
    .from('alumnos')
    .select('id, nombre, dni, email');

  if (ids.length) {
    query = query.in('id', ids);
  } else {
    const s = limpiarBusqueda(q);
    query = query.is('deleted_at', null);
    if (s) query = query.or(`nombre.ilike.%${s}%,dni.ilike.%${s}%`);
    const safeLimit = Math.min(Math.max(Number(limit) || SIMPLE_LIMIT_DEFAULT, 1), SIMPLE_LIMIT_MAX);
    query = query.limit(safeLimit);
  }

  const { data, error } = await query.order('nombre', { ascending: true }).order('id');

  if (error) throw error;
  return data;
}