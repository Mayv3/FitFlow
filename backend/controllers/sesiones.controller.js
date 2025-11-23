import {
  getSesionesByClase,
  createSesion,
  updateSesion,
  deleteSesion,
  inscribirAlumnoSesion,
  desinscribirAlumnoSesion,
  getInscripcionesByAlumno,
} from '../services/sesiones.supabase.js';

// Listar sesiones de una clase
export async function handleGetSesionesByClase(req, res) {
  try {
    const claseId = req.params.claseId;
    const sesiones = await getSesionesByClase(claseId);
    res.json(sesiones);
  } catch (err) {
    console.error('[handleGetSesionesByClase] Error:', err);
    res.status(500).json({ message: err.message ?? 'Error obteniendo sesiones' });
  }
}

// Crear sesión
export async function handleAddSesion(req, res) {
  try {
    const payload = { ...req.body };
    const nueva = await createSesion(payload);

    req.app.get('io')
      ?.to(`gym:${req.body.gym_id}`)
      .emit('sesion:created', { sesion: nueva });

    return res.status(201).json(nueva);
  } catch (error) {
    console.error('[handleAddSesion] Error:', error);
    return res.status(400).json({ error: error.message });
  }
}

// Editar sesión
export async function handleEditSesion(req, res) {
  try {
    const actualizada = await updateSesion(req.params.id, req.body);
    res.json(actualizada);

    req.app.get('io')
      ?.to(`gym:${req.body.gym_id}`)
      .emit('sesion:updated', { sesion: actualizada });
  } catch (error) {
    console.error('[handleEditSesion] Error:', error);
    res.status(400).json({ error: error.message });
  }
}

// Eliminar sesión
export async function handleRemoveSesion(req, res) {
  try {
    const { before } = await deleteSesion(req.params.id);

    req.app.get('io')
      ?.to(`gym:${req.query.gym_id}`)
      .emit('sesion:deleted', { id: before.id });

    res.sendStatus(204);
  } catch (error) {
    console.error('[handleRemoveSesion] Error:', error);
    res.status(400).json({ error: error.message });
  }
}

// Inscribir alumno
export async function handleInscribirAlumno(req, res) {
  try {
    const { sesion_id, alumno_id, gym_id, es_fija = false } = req.body;
    const inscripcion = await inscribirAlumnoSesion({ sesion_id, alumno_id, gym_id, es_fija });

    req.app.get('io')
      ?.to(`gym:${gym_id}`)
      .emit('inscripcion:created', { inscripcion });

    res.status(201).json(inscripcion);
  } catch (error) {
    console.error('[handleInscribirAlumno] Error:', error);
    res.status(400).json({ error: error.message });
  }
}

// Desinscribir alumno
export async function handleDesinscribirAlumno(req, res) {
  try {
    const { sesion_id, alumno_id } = req.body;
    await desinscribirAlumnoSesion({ sesion_id, alumno_id });

    req.app.get('io')
      ?.to(`gym:${req.body.gym_id}`)
      .emit('inscripcion:deleted', { sesion_id, alumno_id });

    res.sendStatus(204);
  } catch (error) {
    console.error('[handleDesinscribirAlumno] Error:', error);
    res.status(400).json({ error: error.message });
  }
}

// Obtener inscripciones de un alumno
export async function handleGetInscripcionesByAlumno(req, res) {
  try {
    const alumnoId = req.params.alumnoId;
    const inscripciones = await getInscripcionesByAlumno(alumnoId);
    res.json(inscripciones);
  } catch (err) {
    console.error('[handleGetInscripcionesByAlumno] Error:', err);
    res.status(500).json({ message: err.message ?? 'Error obteniendo inscripciones' });
  }
}
