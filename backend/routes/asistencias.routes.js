import { Router } from 'express'
import {
  listAsistencias,
  addAsistencia,
  getAsistencia,
  removeAsistencia
} from '../controllers/asistencias.controller.js'

const router = Router()

router.get('/', listAsistencias)
router.post('/', addAsistencia)
router.get('/:id', getAsistencia)
router.delete('/:id', removeAsistencia)

export default router
