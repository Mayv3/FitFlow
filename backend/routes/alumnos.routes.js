import { Router } from 'express'
import {
  listAlumnos,
  getAlumno,
  addAlumno,
  editAlumno,
  removeAlumno
} from '../controllers/alumnos.controller.js'

const router = Router()
router.get('/', listAlumnos)
router.get('/:dni', getAlumno)
router.post('/', addAlumno)
router.put('/:dni', editAlumno)
router.delete('/:dni', removeAlumno)

export default router