import { Router } from 'express'
import { getPlanes, createPlan, updatePlan, deletePlan } from '../controllers/planes.controller.js'
import { verifyToken } from '../middleware/auth.js'
import { supaPerRequest } from '../middleware/supaPerRequest.js'
import { requireRole } from '../middleware/requireRole.js'

const adminOnly = requireRole(1, 2)

const router = Router()
router.use(verifyToken, supaPerRequest)

router.get('/', getPlanes)
router.post('/', adminOnly, createPlan)
router.put('/:id', adminOnly, updatePlan)
router.delete('/:id', adminOnly, deletePlan)

export default router
