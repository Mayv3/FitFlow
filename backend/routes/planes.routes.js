import { Router } from 'express';
import { getPlanes } from '../controllers/planes.controller.js';

const router = Router();

router.get('/', getPlanes);

export default router;