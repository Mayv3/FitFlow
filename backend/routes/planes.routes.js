import { Router } from 'express'
import { getPlanes, createPlan, updatePlan, deletePlan } from '../controllers/planes.controller.js'

const router = Router()

router.get('/', getPlanes)
router.post('/', createPlan)
router.put('/:id', updatePlan)
router.delete('/:id', deletePlan)

export default router
