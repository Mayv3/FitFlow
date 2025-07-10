import {
  getAllCajas,
  openCaja,
  closeCaja,
  deleteCaja
} from '../services/caja.supabase.js'

export const listCajas = async (req, res) => {
  const gymId = req.headers['x-gym-id']
  if (!gymId) return res.status(400).json({ error: 'Falta header x-gym-id' })

  try {
    const cajas = await getAllCajas(gymId)
    res.json({
      message: `Cajas encontradas: ${cajas.length}`,
      cajas
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const abrirCaja = async (req, res) => {
  const gymId = req.headers['x-gym-id']
  if (!gymId) return res.status(400).json({ error: 'Falta header x-gym-id' })

  try {
    const caja = await openCaja(req.body, gymId)
    return res.status(201).json({ message: 'Caja abierta', caja })
  } catch (e) {
    return res.status(400).json({ error: e.message })
  }
}

export const cerrarCaja = async (req, res) => {
  const gymId = req.headers['x-gym-id']
  if (!gymId) return res.status(400).json({ error: 'Falta header x-gym-id' })

  try {
    const caja = await closeCaja(req.params.id, req.body, gymId)
    return res.json({ message: 'Caja cerrada', caja })
  } catch (e) {
    return res.status(400).json({ error: e.message })
  }
}

export const removeCaja = async (req, res) => {
  const gymId = req.headers['x-gym-id']
  if (!gymId) return res.status(400).json({ error: 'Falta header x-gym-id' })

  try {
    const result = await deleteCaja(req.params.id, gymId)
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
