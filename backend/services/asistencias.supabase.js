import { supabase } from '../db/supabaseClient.js'
import { fechaArgentina, horaArgentina } from '../utilities/moment.js';

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
  const dni = String(asistencia.DNI).trim();

  const { data: alumno, error: errAlumno } = await supabase
    .from('alumnos')
    .select('id, plan_id, clases_realizadas, clases_pagadas')
    .eq('dni', dni)
    .eq('gym_id', gymId)
    .single();

  if (errAlumno || !alumno) {
    throw new Error(`No existe un alumno con ese DNI en este gym ${gymId}`);
  }

  const { data: asistenciaHoy, error: errAsistencia } = await supabase
    .from('asistencias')
    .select('id')
    .eq('alumno_id', alumno.id)
    .eq('fecha', fechaArgentina())
    .eq('gym_id', gymId)
    .maybeSingle();

  if (errAsistencia) {
    throw new Error('Error al verificar asistencias previas');
  }

  if (asistenciaHoy) {
    throw new Error('El alumno ya registró asistencia hoy');
  }

  if (alumno.clases_realizadas >= alumno.clases_pagadas) {
    throw new Error('El alumno ya llegó al límite de clases de su plan');
  }

  const payload = {
    fecha: fechaArgentina(),
    hora: horaArgentina(),
    alumno_id: alumno.id,
    plan_id: alumno.plan_id,
    gym_id: gymId,
  };

  const { data: nueva, error } = await supabase
    .from('asistencias')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  await supabase
    .from('alumnos')
    .update({ clases_realizadas: alumno.clases_realizadas + 1 })
    .eq('id', alumno.id);

  return nueva;
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
