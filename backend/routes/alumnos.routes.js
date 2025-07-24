import { Router } from 'express'
import {
  listAlumnos,
  getAlumno,
  addAlumno,
  editAlumno,
  removeAlumno
} from '../controllers/alumnos.controller.js'
import { verifyToken } from '../middleware/auth.js'

const router = Router()
router.get('/', verifyToken, listAlumnos)
router.get('/:dni', getAlumno)
router.post('/', addAlumno)
router.put('/:dni', editAlumno)
router.delete('/:dni', removeAlumno)

export default router