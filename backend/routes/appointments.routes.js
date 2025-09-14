import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { supaPerRequest } from '../middleware/supaPerRequest.js';
import { createAppointment, deleteAppointmentController, getAppointments, updateAppointment } from '../controllers/appointmentsController.js';

const router = Router();

router.get('/', verifyToken, supaPerRequest, getAppointments);
router.post('/', verifyToken, supaPerRequest, createAppointment);
router.put('/:id', verifyToken, supaPerRequest, updateAppointment);
router.delete('/:id', verifyToken, supaPerRequest, deleteAppointmentController);

export default router;