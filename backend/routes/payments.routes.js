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

const routes = Router();

routes.get('/', listPagos);
routes.get('/:id', getPago);
routes.post('/', addPago);
routes.put('/:id', editPago);
routes.delete('/:id', removePago);
routes.put('/:id/restore', undeletePago);
routes.delete('/:id/hard', hardRemovePago);

export default routes;