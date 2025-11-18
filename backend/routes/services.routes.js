import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { supaPerRequest } from '../middleware/supaPerRequest.js';
import {
  listServicios,
  addServicio,
  editServicio,
  removeServicio,
} from '../controllers/services.controller.js';

const router = Router();

router.get('/', verifyToken, supaPerRequest, listServicios);
router.get('/gym/:gym_id/public', listServicios); // Endpoint público para el panel del alumno
router.post('/', verifyToken, supaPerRequest, addServicio);
router.put('/:id', verifyToken, supaPerRequest, editServicio);
router.delete('/:id', verifyToken, supaPerRequest, removeServicio);

export default router;