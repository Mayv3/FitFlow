import {
  getPagosPaged,
  getPagoById,
  createPago,
  updatePago,
  deletePago,
  restorePago,
  hardDeletePago,
} from '../services/pagos.supabase.js';
import * as cache from '../utilities/cache.js'

const PAGOS_TTL = 300 // 5 minutos
const parseBool = (v) => v === 'true' || v === '1' || v === true;

export const listPagos = async (req, res) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const q = String(req.query.q ?? '');
    const includeDeleted = parseBool(req.query.includeDeleted);
    const { fromDate = '', toDate = '' } = req.query;

    const key = `pagos:${req.gymId}:p:${page}:l:${limit}:q:${q}:from:${fromDate}:to:${toDate}:del:${includeDeleted}`
    const cached = await cache.get(key)
    if (cached) return res.json(cached)

    const result = await getPagosPaged({
      supaClient: req.supa,
      page,
      limit,
      q,
      includeDeleted,
      filters: { fromDate, toDate },
    });

    await cache.set(key, result, PAGOS_TTL)
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPago = async (req, res) => {
  try {
    const includeDeleted = parseBool(req.query.includeDeleted);
    const pago = await getPagoById(req.params.id, { includeDeleted });
    if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });
    res.json(pago);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const addPago = async (req, res) => {
  try {
    const nuevoPago = await createPago(req.supa, req.body);
    await cache.delPattern(`pagos:${req.gymId}:*`)
    res.status(201).json(nuevoPago);
  } catch (error) {
    console.error('[addPago] Error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const editPago = async (req, res) => {
  try {
    const includeDeleted = parseBool(req.query.includeDeleted);
    const actualizado = await updatePago(req.supa, req.params.id, req.body, { includeDeleted });
    await cache.delPattern(`pagos:${req.gymId}:*`)
    res.json(actualizado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const removePago = async (req, res) => {
  try {
    await deletePago(req.supa, req.params.id); // soft delete
    await cache.delPattern(`pagos:${req.gymId}:*`)
    res.sendStatus(204);
  } catch (error) {
    console.error('[removePago] Error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const undeletePago = async (req, res) => {
  try {
    const restored = await restorePago(req.params.id);
    await cache.delPattern(`pagos:${req.gymId}:*`)
    res.json(restored);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const hardRemovePago = async (req, res) => {
  try {
    await hardDeletePago(req.params.id);
    await cache.delPattern(`pagos:${req.gymId}:*`)
    res.sendStatus(204);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
