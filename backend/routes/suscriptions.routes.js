import { Router } from 'express'
import {
  handleGetSuscriptions,
  handleGetSuscriptionById,
  handleGetSuscriptionsByGymId,
  handleGetActiveSuscriptionByGymId,
  handleCreateSuscription,
  handleUpdateSuscription,
  handleDeleteSuscription,
} from '../controllers/suscriptions.controller.js'

const router = Router()

// Obtener todas las suscripciones
router.get('/', handleGetSuscriptions)

// Obtener suscripción por ID
router.get('/:id', handleGetSuscriptionById)

// Obtener suscripciones por gym_id (con query param ?active=true para solo activas)
router.get('/gym/:gymId', handleGetSuscriptionsByGymId)

// Obtener la suscripción activa de un gimnasio
router.get('/gym/:gymId/active', handleGetActiveSuscriptionByGymId)

// Crear nueva suscripción (asignar plan a gimnasio)
router.post('/', handleCreateSuscription)

// Actualizar suscripción
router.put('/:id', handleUpdateSuscription)

// Eliminar suscripción
router.delete('/:id', handleDeleteSuscription)

export default router
