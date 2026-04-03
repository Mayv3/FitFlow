import {
    createServicio,
    updateServicio,
    deleteServicio,
    getServiciosPaged
} from '../services/servicios.supabase.js';
import * as cache from '../utilities/cache.js'

export const listServicios = async (req, res) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const q = String(req.query.q ?? '');
    const gymId = req.gymId ?? req.params.gym_id

    const key = `servicios:${gymId}:p:${page}:l:${limit}:q:${q}`
    const cached = await cache.get(key)
    if (cached) return res.json(cached)

    const result = await getServiciosPaged(req.supa, { page, limit, q });
    await cache.set(key, result, 86400)
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const addServicio = async (req, res) => {
    try {
        const nuevo = await createServicio(req.supa, req.body);
        await cache.delPattern(`servicios:${req.gymId}:*`)
        res.status(201).json(nuevo);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const editServicio = async (req, res) => {
    try {
        const actualizado = await updateServicio(req.supa, req.params.id, req.body);
        await cache.delPattern(`servicios:${req.gymId}:*`)
        res.json(actualizado);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const removeServicio = async (req, res) => {
    try {
        await deleteServicio(req.supa, req.params.id);
        await cache.delPattern(`servicios:${req.gymId}:*`)
        res.sendStatus(204);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
