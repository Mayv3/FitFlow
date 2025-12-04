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

export const handleGetGymPlan = async (req, res) => {
  try {
    const { gymId } = req.params
    const suscription = await getActiveSuscriptionByGymId(gymId)
    
    if (!suscription) {
      return res.status(404).json({ 
        error: 'El gimnasio no tiene una suscripción activa',
        hasSubscription: false,
        plan: null
      })
    }

    res.json({
      hasSubscription: true,
      isActive: suscription.is_active,
      plan: suscription.gym_plans,
      subscription: {
        id: suscription.id,
        start_at: suscription.start_at,
        end_at: suscription.end_at,
        is_active: suscription.is_active
      }
    })
  } catch (err) {
    // Si el error es porque no encontró registro, devolver respuesta limpia
    if (err.code === 'PGRST116') {
      return res.json({ 
        hasSubscription: false,
        plan: null
      })
    }
    console.error('Error al verificar plan del gimnasio:', err)
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
