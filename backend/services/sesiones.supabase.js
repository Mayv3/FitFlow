import { supabase, supabaseAdmin } from '../db/supabaseClient.js';
import { getAlumnoById } from './alumnos.supabase.js';

// ==================== SESIONES ====================

export async function getSesionesByClase(claseId) {
  console.log(`[getSesionesByClase] Buscando sesiones para clase_id: ${claseId}`);

  // 1) Traer sesiones
  const { data: sesiones, error: sesionesError } = await supabase
    .from("clases_sesiones")
    .select("id, dia_semana, hora_inicio, capacidad, clase_id")
    .eq("clase_id", claseId)
    .is("deleted_at", null)
    .order("dia_semana", { ascending: true })
    .order("hora_inicio", { ascending: true });

  if (sesionesError) throw sesionesError;

  const result = await Promise.all(
    sesiones.map(async (sesion) => {
      console.log(`\n[getSesionesByClase] === Procesando sesión ${sesion.id} ===`);

      // 2) Traer inscripciones
      const { data: inscripciones, error: insError } = await supabase
        .from("clases_inscripciones")
        .select("alumno_id")
        .eq("sesion_id", sesion.id);

      if (insError) throw insError;

      if (!inscripciones || inscripciones.length === 0) {
        return {
          ...sesion,
          capacidad_actual: 0,
          alumnos_inscritos: []
        };
      }

      const alumnoIds = inscripciones.map((i) => Number(i.alumno_id));

      // 3) Traer los alumnos reales
      const { data: alumnosDb, error: alumnosError } = await supabaseAdmin
        .from("alumnos")
        .select("id, nombre, dni, email")
        .in("id", alumnoIds);

      if (alumnosError) throw alumnosError;

      console.log("[getSesionesByClase] Alumnos encontrados en BD:", alumnosDb);

      // 4) Crear un mapa para acceso rápido
      const alumnosMap = new Map(
        alumnosDb.map((a) => [Number(a.id), a])
      );

      // 5) Construir la lista final alumno por alumno
      const alumnosFinal = alumnoIds.map((id) => {
        if (alumnosMap.has(id)) {
          return alumnosMap.get(id);   // alumno real
        }
        return {
          id,
          nombre: `(ID ${id} — no encontrado)`
        };
      });

      return {
        ...sesion,
        capacidad_actual: alumnosFinal.length,
        alumnos_inscritos: alumnosFinal
      };
    })
  );

  console.log("[getSesionesByClase] RESULTADO FINAL:", JSON.stringify(result, null, 2));
  return result;
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
export async function inscribirAlumnoSesion({ sesion_id, alumno_id, gym_id, es_fija = false }) {
  // Verificar capacidad
  const { data: sesion, error: e1 } = await supabase
    .from('clases_sesiones')
    .select('capacidad, inscripciones:clases_inscripciones(count)')
    .eq('id', sesion_id)
    .is('deleted_at', null)
    .single();

  if (e1) throw e1;
  if (!sesion) throw new Error('Sesión no encontrada');

  const capacidadActual = sesion.inscripciones?.[0]?.count ?? 0;
  if (capacidadActual >= sesion.capacidad) {
    throw new Error('La sesión está llena');
  }

  // Verificar si ya está inscrito
  const { data: existe, error: e2 } = await supabase
    .from('clases_inscripciones')
    .select('id')
    .eq('sesion_id', sesion_id)
    .eq('alumno_id', alumno_id)
    .maybeSingle();

  if (e2) throw e2;
  if (existe) throw new Error('El alumno ya está inscrito en esta sesión');

  // Inscribir
  const { data, error } = await supabase
    .from('clases_inscripciones')
    .insert({ sesion_id, alumno_id, gym_id, estado: 'inscripto', es_fija })
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
