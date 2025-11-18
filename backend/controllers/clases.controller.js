import {
  getClasesService,
  getClaseById,
  createClase,
  updateClase,
  deleteClase,
  getClasesSimpleService,
} from '../services/clases.supabase.js';

// Listar clases con paginación
export async function handleListClases(req, res) {
  try {
    const gymId = req.query.gymId || req.query.gym_id;
    if (!gymId) {
      return res.status(400).json({ message: 'gym_id es requerido' });
    }

    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const q = String(req.query.q ?? '');

    const result = await getClasesService({ gymId, page, limit, q });
    res.json(result);
  } catch (err) {
    console.error('[handleListClases] Error:', err);
    res.status(500).json({ message: err.message ?? 'Error obteniendo clases' });
  }
}

// Obtener una clase por ID
export async function handleGetClase(req, res) {
  try {
    const clase = await getClaseById(req.params.id);
    if (!clase) {
      return res.status(404).json({ error: 'Clase no encontrada' });
    }
    res.json(clase);
  } catch (error) {
    console.error('[handleGetClase] Error:', error);
    res.status(400).json({ error: error.message });
  }
}

// Crear una nueva clase
export async function handleAddClase(req, res) {
  try {
    const payload = { ...req.body };

    const nueva = await createClase(payload);

    req.app.get('io')
      ?.to(`gym:${nueva.gym_id}`)
      .emit('clase:created', { id: nueva.id, clase: nueva });

    return res.status(201).json(nueva);
  } catch (error) {
    console.error('[handleAddClase] Error:', error);
    return res.status(400).json({ error: error.message });
  }
}

// Editar una clase
export async function handleEditClase(req, res) {
  try {
    const prev = await getClaseById(req.params.id).catch(() => null);

    const actualizada = await updateClase(req.params.id, req.body);

    res.json(actualizada);

    try {
      const gymId = actualizada?.gym_id || prev?.gym_id;

      if (gymId) {
        req.app.get('io')
          ?.to(`gym:${gymId}`)
          .emit('clase:updated', {
            id: req.params.id,
            clase: actualizada,
            prev,
          });
      }
    } catch (e) {
      console.warn('[handleEditClase] emit falló:', e?.message);
    }
  } catch (error) {
    console.error('[handleEditClase] Error:', error);
    res.status(400).json({ error: error.message });
  }
}

// Eliminar una clase
export async function handleRemoveClase(req, res) {
  try {
    const { before } = await deleteClase(req.params.id);

    req.app.get('io')
      ?.to(`gym:${before.gym_id}`)
      .emit('clase:deleted', {
        id: before.id,
      });

    res.sendStatus(204);
  } catch (error) {
    console.error('[handleRemoveClase] Error:', error);
    res.status(400).json({ error: error.message });
  }
}

// Listado simple de clases
export async function handleListClasesSimple(req, res) {
  try {
    const gymId = req.query.gymId || req.query.gym_id;
    if (!gymId) {
      return res.status(400).json({ message: 'gym_id es requerido' });
    }

    const clases = await getClasesSimpleService(gymId);
    res.json(clases);
  } catch (err) {
    console.error('[handleListClasesSimple] Error:', err);
    res.status(500).json({ message: err.message ?? 'Error obteniendo clases simples' });
  }
}
