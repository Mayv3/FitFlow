import { Router } from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';

const router = Router();

// Obtener servicios/clases de un gimnasio (público)
router.get('/gym/:gym_id/services', async (req, res) => {
  try {
    const { gym_id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('clases')
      .select('id, nombre, descripcion, capacidad_default, gym_id')
      .eq('gym_id', gym_id)
      .is('deleted_at', null)
      .order('nombre');

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('[getGymServices] Error:', error);
    res.status(500).json({ error: 'Error obteniendo servicios' });
  }
});

router.get('/service/:service_id/sessions', async (req, res) => {
  try {
    const { service_id } = req.params;
    const { alumno_id } = req.query;

    // Obtener sesiones de la clase
    const { data, error } = await supabaseAdmin
      .from('clases_sesiones')
      .select(`
        id,
        clase_id,
        dia_semana,
        hora_inicio,
        capacidad,
        gym_id,
        fecha_proxima
      `)
      .eq('clase_id', service_id)
      .is('deleted_at', null)
      .order('fecha_proxima', { ascending: true, nullsLast: true })
      .order('hora_inicio', { ascending: true });

    if (error) throw error;

    // Si se proporciona alumno_id, verificar inscripciones
    if (alumno_id && data) {
      const sesionesConEstado = await Promise.all(
        data.map(async (sesion) => {
          // Verificar si el alumno está inscrito (inscripto o asistido)
          const { data: inscripcion } = await supabaseAdmin
            .from('clases_inscripciones')
            .select('id, estado, es_fija')
            .eq('sesion_id', sesion.id)
            .eq('alumno_id', alumno_id)
            .in('estado', ['inscripto', 'asistio'])
            .maybeSingle();

          // Contar inscripciones actuales (solo inscriptos y asistidos)
          const { data: inscripciones } = await supabaseAdmin
            .from('clases_inscripciones')
            .select('id')
            .eq('sesion_id', sesion.id)
            .in('estado', ['inscripto', 'asistio']);

          return {
            ...sesion,
            inscrito: !!inscripcion,
            es_fija: inscripcion?.es_fija || false,
            cupos_disponibles: sesion.capacidad - (inscripciones?.length || 0),
          };
        })
      );
      return res.json(sesionesConEstado);
    }

    res.json(data || []);
  } catch (error) {
    console.error('[getServiceSessions] Error:', error);
    res.status(500).json({ error: 'Error obteniendo sesiones' });
  }
});

// Inscribir alumno a una sesión
router.post('/session/:session_id/enroll', async (req, res) => {
  try {
    const { session_id } = req.params;
    const { alumno_id, es_fija = false } = req.body;

    if (!alumno_id) {
      return res.status(400).json({ error: 'alumno_id es requerido' });
    }

    // Verificar que la sesión existe
    const { data: sesion, error: sesionError } = await supabaseAdmin
      .from('clases_sesiones')
      .select('id, capacidad, clase_id, gym_id')
      .eq('id', session_id)
      .single();

    if (sesionError || !sesion) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    // Contar inscripciones actuales (solo inscriptos y asistidos)
    const { data: inscripciones, error: countError } = await supabaseAdmin
      .from('clases_inscripciones')
      .select('id')
      .eq('sesion_id', session_id)
      .in('estado', ['inscripto', 'asistio']);

    if (countError) throw countError;

    const inscritosActuales = inscripciones?.length || 0;

    if (inscritosActuales >= sesion.capacidad) {
      return res.status(400).json({ error: 'No hay cupos disponibles' });
    }

    // Verificar que el alumno no esté ya inscrito (inscripto o asistido)
    const { data: existente } = await supabaseAdmin
      .from('clases_inscripciones')
      .select('id, estado')
      .eq('sesion_id', session_id)
      .eq('alumno_id', alumno_id)
      .in('estado', ['inscripto', 'asistio'])
      .maybeSingle();

    if (existente) {
      return res.status(400).json({ error: 'Ya estás inscrito en esta sesión' });
    }

    // Crear inscripción
    const { data: inscripcion, error: inscripcionError } = await supabaseAdmin
      .from('clases_inscripciones')
      .insert({
        sesion_id: session_id,
        alumno_id: alumno_id,
        gym_id: sesion.gym_id,
        estado: 'inscripto',
        es_fija: es_fija,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (inscripcionError) throw inscripcionError;

    res.json({ 
      success: true, 
      message: 'Inscripción exitosa',
      inscripcion 
    });
  } catch (error) {
    console.error('[enrollSession] Error:', error);
    res.status(500).json({ error: 'Error en la inscripción' });
  }
});

// Cancelar inscripción
router.post('/session/:session_id/cancel', async (req, res) => {
  try {
    const { session_id } = req.params;
    const { alumno_id } = req.body;

    if (!alumno_id) {
      return res.status(400).json({ error: 'alumno_id es requerido' });
    }

    // Buscar inscripción activa
    const { data: inscripcion, error: inscripcionError } = await supabaseAdmin
      .from('clases_inscripciones')
      .select('id, sesion_id, estado')
      .eq('sesion_id', session_id)
      .eq('alumno_id', alumno_id)
      .in('estado', ['inscripto', 'asistio'])
      .maybeSingle();

    if (inscripcionError) {
      console.error('[cancelSession] Error buscando inscripción:', inscripcionError);
      throw inscripcionError;
    }

    if (!inscripcion) {
      return res.status(404).json({ error: 'Inscripción no encontrada' });
    }

    // No permitir cancelar si ya asistió
    if (inscripcion.estado === 'asistio') {
      return res.status(400).json({ error: 'No puedes cancelar una clase a la que ya asististe' });
    }

    // Eliminar el registro de inscripción
    const { error: deleteError } = await supabaseAdmin
      .from('clases_inscripciones')
      .delete()
      .eq('id', inscripcion.id);

    if (deleteError) throw deleteError;

    res.json({ success: true, message: 'Inscripción cancelada exitosamente' });
  } catch (error) {
    console.error('[cancelSession] Error:', error);
    res.status(500).json({ error: 'Error cancelando inscripción' });
  }
});

// Obtener inscripciones del alumno
router.get('/alumno/:alumno_id/enrollments', async (req, res) => {
  try {
    const { alumno_id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('clases_inscripciones')
      .select(`
        id,
        estado,
        created_at,
        clases_sesiones:sesion_id (
          id,
          dia_semana,
          hora_inicio,
          capacidad,
          clases:clase_id (
            id,
            nombre,
            descripcion
          )
        )
      `)
      .eq('alumno_id', alumno_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('[getAlumnoEnrollments] Error:', error);
    res.status(500).json({ error: 'Error obteniendo inscripciones' });
  }
});

export default router;
