import { Router } from 'express';
import {
  listPagos,
  getPago,
  addPago,
  editPago,
  removePago,
  undeletePago,
  hardRemovePago,
} from '../controllers/payments.controller.js';
import { verifyToken } from '../middleware/auth.js';
import { supaPerRequest } from '../middleware/supaPerRequest.js';
import { requireRole } from '../middleware/requireRole.js';

const adminOnly = requireRole(1, 2);

const routes = Router();
routes.use(verifyToken, supaPerRequest);

routes.get('/', listPagos);
routes.get('/:id', getPago);
routes.post('/', addPago);
routes.put('/:id', editPago);
routes.delete('/:id', removePago);
routes.put('/:id/restore', adminOnly, undeletePago);
routes.delete('/:id/hard', adminOnly, hardRemovePago);

export default routes;