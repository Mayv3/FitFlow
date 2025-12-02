import { Router } from 'express'
import {
  handleGetGymPlans,
  handleGetGymPlanById,
  handleCreateGymPlan,
  handleUpdateGymPlan,
  handleDeleteGymPlan,
} from '../controllers/gymPlans.controller.js'

const router = Router()

router.get('/', handleGetGymPlans)
router.get('/:id', handleGetGymPlanById)
router.post('/', handleCreateGymPlan)
router.put('/:id', handleUpdateGymPlan)
router.delete('/:id', handleDeleteGymPlan)

export default router
