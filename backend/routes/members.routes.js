import { Router } from 'express'
import {
  getAlumno,
  addAlumno,
  editAlumno,
  removeAlumno,
  handleListAlumnosByGym,
  handleListAlumnosSimple,
  handleGetActiveAlumnosCountByGym,
  handleGetExpiredAlumnos,
} from '../controllers/members.controller.js'
import { verifyToken } from '../middleware/auth.js'
import { supaPerRequest } from '../middleware/supaPerRequest.js'
import { requireRole } from '../middleware/requireRole.js'

const router = Router()
// Cuenta alumnos de TODOS los gimnasios: solo el OWNER (role 1).
router.get('/active-count', verifyToken, requireRole(1), handleGetActiveAlumnosCountByGym);
router.get('/expired', verifyToken, supaPerRequest, handleGetExpiredAlumnos);
router.get('/simple', verifyToken, supaPerRequest, handleListAlumnosSimple);
router.get('/', verifyToken, supaPerRequest, handleListAlumnosByGym);
router.get('/:dni', verifyToken, supaPerRequest, getAlumno);

router.post('/', verifyToken, supaPerRequest, addAlumno);
router.put('/:dni', verifyToken, supaPerRequest, editAlumno);
router.delete('/:dni', verifyToken, supaPerRequest, removeAlumno);


export default router