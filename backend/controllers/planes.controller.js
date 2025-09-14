import {
  getPlanes as getPlanesSvc,
  createPlan as createPlanSvc,
  updatePlan as updatePlanSvc,
  deletePlan as deletePlanSvc,
} from '../services/planes.supabase.js'

export const getPlanes = async (req, res) => {
  try {
    const { gymId, page, pageSize, q } = req.query
    if (page && pageSize) {
      const { items, total } = await getPlanesSvc({
        gymId,
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        q,
      })
      return res.status(200).json({ items, total })
    }
    const planes = await getPlanesSvc({ gymId })
    return res.status(200).json(planes)
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener los planes', detail: err.message })
  }
}

export const createPlan = async (req, res) => {
  try {
    const { nombre, numero_clases, precio, gym_id, color } = req.body
    const plan = await createPlanSvc({ nombre, numero_clases, precio, gym_id, color })
    res.status(201).json(plan)
  } catch (err) {
    res.status(500).json({ message: 'Error al crear plan', detail: err.message })
  }
}

export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, numero_clases, precio, color } = req.body
    const plan = await updatePlanSvc(Number(id), { nombre, numero_clases, precio, color })
    res.status(200).json(plan)
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar plan', detail: err.message })
  }
}

export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params
    await deletePlanSvc(Number(id))
    res.status(204).end()
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar plan', detail: err.message })
  }
}
