import {
  getGymPlans,
  getGymPlanById,
  createGymPlan,
  updateGymPlan,
  deleteGymPlan,
} from '../services/gymPlans.supabase.js'

export const handleGetGymPlans = async (req, res) => {
  try {
    const plans = await getGymPlans()
    res.json(plans)
  } catch (err) {
    console.error('Error al obtener planes de gimnasio:', err)
    res.status(500).json({ error: err.message })
  }
}

export const handleGetGymPlanById = async (req, res) => {
  try {
    const { id } = req.params
    const plan = await getGymPlanById(id)
    res.json(plan)
  } catch (err) {
    console.error('Error al obtener plan de gimnasio:', err)
    res.status(500).json({ error: err.message })
  }
}

export const handleCreateGymPlan = async (req, res) => {
  try {
    const plan = await createGymPlan(req.body)
    res.status(201).json(plan)
  } catch (err) {
    console.error('Error al crear plan de gimnasio:', err)
    res.status(500).json({ error: err.message })
  }
}

export const handleUpdateGymPlan = async (req, res) => {
  try {
    const { id } = req.params
    const plan = await updateGymPlan(id, req.body)
    res.json(plan)
  } catch (err) {
    console.error('Error al actualizar plan de gimnasio:', err)
    res.status(500).json({ error: err.message })
  }
}

export const handleDeleteGymPlan = async (req, res) => {
  try {
    const { id } = req.params
    await deleteGymPlan(id)
    res.status(204).end()
  } catch (err) {
    console.error('Error al eliminar plan de gimnasio:', err)
    res.status(500).json({ error: err.message })
  }
}
