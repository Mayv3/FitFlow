import { Router } from 'express';
import { getPaymentMethodsController } from '../controllers/paymentsMethod.controller.js';

const router = Router();

router.get('/', getPaymentMethodsController);

export default router;