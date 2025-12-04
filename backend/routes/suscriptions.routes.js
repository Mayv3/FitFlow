import { Router } from 'express'
import {
  handleGetSuscriptions,
  handleGetSuscriptionById,
  handleGetSuscriptionsByGymId,
  handleGetActiveSuscriptionByGymId,
  handleGetGymPlan,
  handleCreateSuscription,
  handleUpdateSuscription,
  handleDeleteSuscription,
} from '../controllers/suscriptions.controller.js'

const router = Router()

// Obtener todas las suscripciones
router.get('/', handleGetSuscriptions)

// Obtener suscripciones por gym_id (con query param ?active=true para solo activas)
router.get('/gym/:gymId', handleGetSuscriptionsByGymId)

// Obtener la suscripción activa de un gimnasio (incluye el plan)
router.get('/gym/:gymId/active', handleGetActiveSuscriptionByGymId)

// Verificar el plan de suscripción de un gimnasio
router.get('/gym/:gymId/plan', handleGetGymPlan)

// Obtener suscripción por ID
router.get('/:id', handleGetSuscriptionById)

// Crear nueva suscripción (asignar plan a gimnasio)
router.post('/', handleCreateSuscription)

// Actualizar suscripción
router.put('/:id', handleUpdateSuscription)

// Eliminar suscripción
router.delete('/:id', handleDeleteSuscription)

export default router
