import { Router } from 'express'
import {
  handleGetGymPlans,
  handleGetGymPlanById,
  handleCreateGymPlan,
  handleUpdateGymPlan,
  handleDeleteGymPlan,
} from '../controllers/gymPlans.controller.js'
import { supaPerRequest } from '../middleware/supaPerRequest.js'
import { requireRole } from '../middleware/requireRole.js'

const adminOnly = requireRole(1, 2)

const router = Router()
router.use(supaPerRequest)

router.get('/', handleGetGymPlans)
router.get('/:id', handleGetGymPlanById)
router.post('/', adminOnly, handleCreateGymPlan)
router.put('/:id', adminOnly, handleUpdateGymPlan)
router.delete('/:id', adminOnly, handleDeleteGymPlan)

export default router
