import {
  getPagosPaged,
  getPagoById,
  createPago,
  updatePago,
  deletePago,
  restorePago,
  hardDeletePago,
} from '../services/pagos.supabase.js';

const parseBool = (v) => v === 'true' || v === '1' || v === true;

export const listPagos = async (req, res) => {

  try {
    const gymId = req.query.gym_id || null;
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const q = String(req.query.q ?? '');
    const includeDeleted = parseBool(req.query.includeDeleted);

    console.log('fromDate:', req.query.fromDate);
    console.log('toDate:', req.query.toDate);

    const result = await getPagosPaged({
      gymId, page, limit, q, includeDeleted, filters: {
        fromDate: req.query.fromDate,
        toDate: req.query.toDate,
      },
    });
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
    const nuevoPago = await createPago(req.body);
    res.status(201).json(nuevoPago);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const editPago = async (req, res) => {
  try {
    const includeDeleted = parseBool(req.query.includeDeleted);
    const actualizado = await updatePago(req.params.id, req.body, { includeDeleted });
    res.json(actualizado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const removePago = async (req, res) => {
  try {
    await deletePago(req.params.id); // soft delete
    res.sendStatus(204);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const undeletePago = async (req, res) => {
  try {
    const restored = await restorePago(req.params.id);
    res.json(restored);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const hardRemovePago = async (req, res) => {
  try {
    await hardDeletePago(req.params.id);
    res.sendStatus(204);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
