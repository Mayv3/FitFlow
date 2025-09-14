import {
    createServicio,
    updateServicio,
    deleteServicio,
    getServiciosPaged
} from '../services/servicios.supabase.js';

export const listServicios = async (req, res) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const q = String(req.query.q ?? '');

    const result = await getServiciosPaged(req.supa, { page, limit, q });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const addServicio = async (req, res) => {
    try {
        const nuevo = await createServicio(req.supa, req.body);
        res.status(201).json(nuevo);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const editServicio = async (req, res) => {
    try {
        const actualizado = await updateServicio(req.supa, req.params.id, req.body);
        res.json(actualizado);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const removeServicio = async (req, res) => {
    try {
        await deleteServicio(req.supa, req.params.id);
        res.sendStatus(204);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
