import { Router } from 'express'
import {
  getAlumno,
  addAlumno,
  editAlumno,
  removeAlumno,
  handleListAlumnosByGym,
  handleListAlumnosSimple,
} from '../controllers/members.controller.js'
import { verifyToken } from '../middleware/auth.js'

const router = Router()
router.get('/simple', verifyToken, handleListAlumnosSimple);
router.get('/', verifyToken, handleListAlumnosByGym);
router.get('/:dni', getAlumno);

router.post('/', addAlumno);
router.put('/:dni', editAlumno);
router.delete('/:dni', verifyToken, removeAlumno);


export default router