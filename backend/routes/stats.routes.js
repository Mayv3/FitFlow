import { Router } from 'express';
import { getGymStatsController } from '../controllers/stats.controller.js';

const router = Router();

router.get('/', getGymStatsController);

export default router;