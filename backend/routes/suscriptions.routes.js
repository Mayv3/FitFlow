// src/routes/suscriptions.routes.js
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

router.get('/', handleGetSuscriptions)

router.get('/gym/:gymId', handleGetSuscriptionsByGymId)
router.get('/gym/:gymId/active', handleGetActiveSuscriptionByGymId)
router.get('/gym/:gymId/plan', handleGetGymPlan)

router.get('/:id', handleGetSuscriptionById)
router.post('/', handleCreateSuscription)
router.put('/:id', handleUpdateSuscription)
router.delete('/:id', handleDeleteSuscription)

export default router
