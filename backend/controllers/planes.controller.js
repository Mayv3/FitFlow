import {
  getPlanesSvc,
  createPlanSvc,
  updatePlanSvc,
  deletePlanSvc,
} from '../services/planes.supabase.js'
import * as cache from '../utilities/cache.js'

const PLANES_TTL = 86400 // 24 horas

export const getPlanes = async (req, res) => {
  try {
    const { q } = req.query
    const gymId = req.gymId

    if (!gymId) {
      return res.status(401).json({ message: 'Gym no identificado' })
    }

    const key = `planes:${gymId}:q:${q ?? ''}`
    const cached = await cache.get(key)
    if (cached) return res.status(200).json(cached)

    const planes = await getPlanesSvc({ supa: req.supa, q })
    const result = { items: planes, total: planes.length }
    await cache.set(key, result, PLANES_TTL)

    return res.status(200).json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({
      message: 'Error al obtener los planes',
      detail: err.message,
    })
  }
}

export const createPlan = async (req, res) => {
  try {
    const { nombre, numero_clases, precio, color } = req.body
    const gym_id = req.gymId

    if (!gym_id) {
      return res.status(401).json({ message: 'Gym no identificado' })
    }

    const plan = await createPlanSvc({
      supa: req.supa,
      nombre,
      numero_clases,
      precio,
      color,
      gym_id,
    })

    await cache.delPattern(`planes:${gym_id}:*`)
    res.status(201).json(plan)
  } catch (err) {
    res.status(500).json({
      message: 'Error al crear plan',
      detail: err.message,
    })
  }
}

export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, numero_clases, precio, color } = req.body
    const gym_id = req.gymId

    if (!gym_id) {
      return res.status(401).json({ message: 'Gym no identificado' })
    }

    const plan = await updatePlanSvc({
      supa: req.supa,
      id,
      nombre,
      numero_clases,
      precio,
      color,
      gym_id,
    })

    if (!plan) {
      return res.status(404).json({ message: 'Plan no encontrado' })
    }

    await cache.delPattern(`planes:${gym_id}:*`)
    res.json(plan)
  } catch (err) {
    res.status(500).json({
      message: 'Error al actualizar plan',
      detail: err.message,
    })
  }
}

export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params
    const gym_id = req.gymId

    if (!gym_id) {
      return res.status(401).json({ message: 'Gym no identificado' })
    }

    const deleted = await deletePlanSvc({
      supa: req.supa,
      id: Number(id),
    })

    if (!deleted) {
      return res.status(404).json({ message: 'Plan no encontrado' })
    }

    await cache.delPattern(`planes:${gym_id}:*`)
    res.status(204).end()
  } catch (err) {
    res.status(500).json({
      message: 'Error al eliminar plan',
      detail: err.message,
    })
  }
}

