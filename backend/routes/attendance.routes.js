import { Router } from 'express'
import {
  listAsistencias,
  addAsistencia,
  getAsistencia,
  removeAsistencia
} from '../controllers/attendance.controller.js'
import { verifyToken } from '../middleware/auth.js'
import {supaPerRequest} from '../middleware/supaPerRequest.js'
const router = Router()

router.use(verifyToken, supaPerRequest)

router.get('/', listAsistencias)
router.post('/', addAsistencia)
router.get('/:id', getAsistencia)
router.delete('/:id', removeAsistencia)

export default router
