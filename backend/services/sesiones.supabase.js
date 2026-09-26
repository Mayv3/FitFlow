import { supabaseAdmin } from '../config/supabaseClient.js';
import { getAlumnoById } from './alumnos.supabase.js';
import { fechaArgentina } from '../utilities/moment.js';

// El backend es la capa confiable: usa service_role y saltea el RLS (que es un
// safety-net para acceso REST directo con anon key). El aislamiento por gimnasio
// se mantiene porque cada query filtra explícitamente por gym_id / clase_id.
const supabase = supabaseAdmin;

// ==================== SESIONES ====================

export async function getSesionesByClase(claseId) {
  // 1) Traer sesiones
  const { data: sesiones, error: sesionesError } = await supabase
    .from("clases_sesiones")
    .select("id, dia_semana, hora_inicio, capacidad, clase_id, fecha_proxima")
    .eq("clase_id", claseId)
    .is("deleted_at", null)
    .order("fecha_proxima", { ascending: true, nullsLast: true })
    .order("hora_inicio", { ascending: true });

  if (sesionesError) throw sesionesError;
  if (!sesiones?.length) return [];

  // 2) Inscripciones de TODAS las sesiones en una sola query (antes: 2 queries por sesión)
  const { data: inscripciones, error: insError } = await supabase
    .from("clases_inscripciones")
    .select("sesion_id, alumno_id, es_fija")
    .in("sesion_id", sesiones.map((s) => s.id))
    .eq("estado", "inscripto");

  if (insError) throw insError;

  // 3) Todos los alumnos inscriptos en una sola query
  const alumnoIds = [...new Set((inscripciones ?? []).map((i) => Number(i.alumno_id)))];
  let alumnosMap = new Map();
  if (alumnoIds.length) {
    const { data: alumnosDb, error: alumnosError } = await supabaseAdmin
      .from("alumnos")
      .select("id, nombre, dni, email, fecha_de_vencimiento")
      .in("id", alumnoIds);

    if (alumnosError) throw alumnosError;
    alumnosMap = new Map(alumnosDb.map((a) => [Number(a.id), a]));
  }

  const inscripcionesPorSesion = new Map();
  for (const i of inscripciones ?? []) {
    if (!inscripcionesPorSesion.has(i.sesion_id)) inscripcionesPorSesion.set(i.sesion_id, []);
    inscripcionesPorSesion.get(i.sesion_id).push(i);
  }

  // 4) Armar cada sesión en memoria, filtrando fijas con el plan vencido
  const today = fechaArgentina();
  return sesiones.map((sesion) => {
    const alumnosFinal = (inscripcionesPorSesion.get(sesion.id) ?? [])
      .filter((i) => {
        if (!i.es_fija) return true;
        const alumno = alumnosMap.get(Number(i.alumno_id));
        return (alumno?.fecha_de_vencimiento ?? '') >= today;
      })
      .map((i) => {
        const id = Number(i.alumno_id);
        const esFija = i.es_fija || false;
        if (alumnosMap.has(id)) {
          return { ...alumnosMap.get(id), es_fija: esFija };
        }
        return { id, nombre: `(ID ${id} — no encontrado)`, es_fija: esFija };
      });

    return {
      ...sesion,
      capacidad_actual: alumnosFinal.length,
      alumnos_inscritos: alumnosFinal,
      tiene_fijas: alumnosFinal.some((a) => a.es_fija)
    };
  });
}



// Crear una sesión
export async function createSesion(sesion) {
  const { data, error } = await supabase
    .from('clases_sesiones')
    .insert(sesion)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

// Actualizar una sesión
export async function updateSesion(id, nuevosDatos) {
  const { data, error } = await supabase
    .from('clases_sesiones')
    .update(nuevosDatos)
    .eq('id', id)
    .is('deleted_at', null)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

// Eliminar una sesión (soft delete)
export async function deleteSesion(id) {
  const { data: before, error: e1 } = await supabase
    .from('clases_sesiones')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (e1) throw e1;
  if (!before) throw new Error('Sesión no encontrada o ya eliminada');

  const { error: e2 } = await supabaseAdmin
    .from('clases_sesiones')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', before.id);

  if (e2) throw e2;

  return { before };
}

// ==================== INSCRIPCIONES ====================

// Inscribir alumno a una sesión
// Errores de la RPC inscribir_alumno_sesion → código estable para los controllers.
const INSCRIPCION_ERRORES = {
  P0002: 'SESION_NO_ENCONTRADA',
  GYM10: 'SESION_LLENA',
  GYM11: 'YA_INSCRIPTO',
  23505: 'YA_INSCRIPTO', // índice único inscripcion_unica_por_sesion
};

/**
 * Inscribe con control de cupo atómico (RPC inscribir_alumno_sesion): la DB
 * bloquea la sesión mientras cuenta e inserta, así dos inscripciones
 * simultáneas no pueden pasar la capacidad. Lo usan el panel y el portal.
 */
export async function inscribirAlumnoSesion({ sesion_id, alumno_id, gym_id = null, es_fija = false }) {
  const { data, error } = await supabase.rpc('inscribir_alumno_sesion', {
    p_sesion_id: sesion_id,
    p_alumno_id: alumno_id,
    p_es_fija: es_fija,
    p_gym_id: gym_id,
  });

  if (error) {
    const err = new Error(
      error.code === '23505' ? 'El alumno ya está inscrito en esta sesión' : error.message
    );
    err.code = INSCRIPCION_ERRORES[error.code] ?? error.code;
    throw err;
  }
  return data;
}

// Cambiar estado fija/temporal de una inscripción
export async function toggleEsFijaInscripcion({ sesion_id, alumno_id, es_fija }) {
  const { data, error } = await supabase
    .from('clases_inscripciones')
    .update({ es_fija })
    .eq('sesion_id', sesion_id)
    .eq('alumno_id', alumno_id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

// Desinscribir alumno de una sesión
export async function desinscribirAlumnoSesion({ sesion_id, alumno_id }) {
  const { error } = await supabase
    .from('clases_inscripciones')
    .delete()
    .eq('sesion_id', sesion_id)
    .eq('alumno_id', alumno_id);

  if (error) throw error;
  return { success: true };
}

// Obtener inscripciones de un alumno
export async function getInscripcionesByAlumno(alumno_id) {
  const { data, error } = await supabase
    .from('clases_inscripciones')
    .select(`
      id,
      sesion:clases_sesiones(
        id,
        dia_semana,
        hora_inicio,
        capacidad,
        clase:clases(id, nombre, color)
      )
    `)
    .eq('alumno_id', alumno_id);

  if (error) throw error;
  return data;
}
