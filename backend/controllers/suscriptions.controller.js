import {
  getSuscriptions,
  getSuscriptionById,
  getSuscriptionsByGymId,
  getActiveSuscriptionByGymId,
  createSuscription,
  updateSuscription,
  deleteSuscription,
} from '../services/suscriptions.supabase.js'

export const handleGetSuscriptions = async (req, res) => {
  try {
    const suscriptions = await getSuscriptions()
    res.json(suscriptions)
  } catch (err) {
    console.error('Error al obtener suscripciones:', err)
    res.status(500).json({ error: err.message })
  }
}

export const handleGetSuscriptionById = async (req, res) => {
  try {
    const { id } = req.params
    const suscription = await getSuscriptionById(id)
    res.json(suscription)
  } catch (err) {
    console.error('Error al obtener suscripción:', err)
    res.status(500).json({ error: err.message })
  }
}

export const handleGetSuscriptionsByGymId = async (req, res) => {
  try {
    const { gymId } = req.params
    const onlyActive = req.query.active === 'true'
    const suscriptions = await getSuscriptionsByGymId(gymId, { onlyActive })
    res.json(suscriptions)
  } catch (err) {
    console.error('Error al obtener suscripciones del gimnasio:', err)
    res.status(500).json({ error: err.message })
  }
}

export const handleGetActiveSuscriptionByGymId = async (req, res) => {
  try {
    const { gymId } = req.params
    const suscription = await getActiveSuscriptionByGymId(gymId)
    res.json(suscription)
  } catch (err) {
    console.error('Error al obtener suscripción activa del gimnasio:', err)
    res.status(500).json({ error: err.message })
  }
}

export const handleCreateSuscription = async (req, res) => {
  try {
    const suscription = await createSuscription(req.body)
    res.status(201).json(suscription)
  } catch (err) {
    console.error('Error al crear suscripción:', err)
    res.status(500).json({ error: err.message })
  }
}

export const handleUpdateSuscription = async (req, res) => {
  try {
    const { id } = req.params
    const suscription = await updateSuscription(id, req.body)
    res.json(suscription)
  } catch (err) {
    console.error('Error al actualizar suscripción:', err)
    res.status(500).json({ error: err.message })
  }
}

export const handleDeleteSuscription = async (req, res) => {
  try {
    const { id } = req.params
    await deleteSuscription(id)
    res.status(204).end()
  } catch (err) {
    console.error('Error al eliminar suscripción:', err)
    res.status(500).json({ error: err.message })
  }
}
