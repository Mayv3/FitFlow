import {
  getAllPagos,
  getPagoById,
  createPago,
  updatePago,
  deletePago
} from '../services/pagos.supabase.js'

export const listPagos = async (_req, res) => {
  try {
    const pagos = await getAllPagos()
    res.json(pagos)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getPago = async (req, res) => {
  try {
    const pago = await getPagoById(req.params.id)
    res.json(pago)
  } catch (error) {
    res.status(404).json({ error: error.message })
  }
}

export const addPago = async (req, res) => {
  try {
    const nuevoPago = await createPago(req.body)
    res.status(201).json(nuevoPago)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

export const editPago = async (req, res) => {
  try {
    const actualizado = await updatePago(req.params.id, req.body)
    res.json(actualizado)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

export const removePago = async (req, res) => {
  try {
    await deletePago(req.params.id)
    res.sendStatus(204)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
