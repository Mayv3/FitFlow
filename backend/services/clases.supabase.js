import { supabase, supabaseAdmin } from '../db/supabaseClient.js';

// Obtener todas las clases de un gimnasio
export async function getClasesService({ gymId, page, limit, q = '' }) {
  const offset = (page - 1) * limit;

  let query = supabase
    .from('clases')
    .select('*', { count: 'exact' })
    .eq('gym_id', gymId)
    .is('deleted_at', null);

  if (q.trim()) {
    const like = `%${q}%`;
    query = query.or([
      `nombre.ilike.${like}`,
      `descripcion.ilike.${like}`,
    ].join(','));
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  const clases = data ?? [];
  if (clases.length === 0) return { items: [], total: 0, page, limit, q };

  // Batch 1: todas las sesiones de todas las clases en una sola query
  const claseIds = clases.map(c => c.id);
  const { data: todasSesiones } = await supabase
    .from('clases_sesiones')
    .select('id, clase_id')
    .in('clase_id', claseIds)
    .is('deleted_at', null);

  const sesionIds = (todasSesiones ?? []).map(s => s.id);

  // Batch 2: inscripciones fijas de todas las sesiones en una sola query
  const sesionesConFijas = new Set();
  if (sesionIds.length > 0) {
    const { data: inscripciones } = await supabase
      .from('clases_inscripciones')
      .select('sesion_id, alumno:alumnos(fecha_de_vencimiento)')
      .in('sesion_id', sesionIds)
      .eq('es_fija', true);
    const today = new Date().toISOString().slice(0, 10);
    (inscripciones ?? [])
      .filter(i => (i.alumno?.fecha_de_vencimiento ?? '') >= today)
      .forEach(i => sesionesConFijas.add(i.sesion_id));
  }

  // Join en memoria
  const sesionIdsPorClase = {};
  (todasSesiones ?? []).forEach(s => {
    if (!sesionIdsPorClase[s.clase_id]) sesionIdsPorClase[s.clase_id] = [];
    sesionIdsPorClase[s.clase_id].push(s.id);
  });

  const items = clases.map(clase => ({
    ...clase,
    tiene_fijas: (sesionIdsPorClase[clase.id] ?? []).some(sid => sesionesConFijas.has(sid)),
  }));

  return {
    items,
    total: count ?? 0,
    page,
    limit,
    q,
  };
}

// Obtener una clase por ID con sus sesiones
export async function getClaseById(id) {
  const { data, error } = await supabase
    .from('clases')
    .select(`
      *,
      sesiones:clases_sesiones(
        *,
        inscripciones:clases_inscripciones(
          id,
          alumno_id,
          es_fija,
          alumno:alumnos(id, nombre, dni, email, fecha_de_vencimiento)
        )
      )
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw error;
  
  if (data && data.sesiones) {
    const today = new Date().toISOString().slice(0, 10);
    const isActive = (i) => !i.es_fija || (i.alumno?.fecha_de_vencimiento ?? '') >= today;
    data.sesiones = data.sesiones
      .filter(s => !s.deleted_at)
      .map(sesion => {
        const activeInscripciones = (sesion.inscripciones ?? []).filter(isActive);
        return {
          ...sesion,
          capacidad_actual: activeInscripciones.length,
          alumnos_inscritos: activeInscripciones.map(i => i.alumno),
        };
      })
      .sort((a, b) => {
        if (a.dia_semana !== b.dia_semana) return a.dia_semana - b.dia_semana;
        return a.hora_inicio.localeCompare(b.hora_inicio);
      });
  }
  
  return data;
}

// Crear una nueva clase
export async function createClase(clase) {
  const { data, error } = await supabase
    .from('clases')
    .insert(clase)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

// Actualizar una clase
export async function updateClase(id, nuevosDatos) {
  const { data, error } = await supabase
    .from('clases')
    .update(nuevosDatos)
    .eq('id', id)
    .is('deleted_at', null)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

// Eliminar una clase (soft delete)
export async function deleteClase(id) {
  const { data: before, error: e1 } = await supabase
    .from('clases')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (e1) throw e1;
  if (!before) throw new Error('Clase no encontrada o ya eliminada');

  const { error: e2 } = await supabaseAdmin
    .from('clases')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', before.id);

  if (e2) throw e2;

  return { before };
}

// Obtener listado simple de clases (para selects)
export async function getClasesSimpleService(gymId) {
  const { data, error } = await supabase
    .from('clases')
    .select('id, nombre, capacidad_default, color')
    .eq('gym_id', gymId)
    .is('deleted_at', null)
    .order('nombre', { ascending: true });

  if (error) throw error;
  return data;
}
