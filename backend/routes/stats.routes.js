import { Router } from 'express';
import { getGymStatsController } from '../controllers/stats.controller.js';
import { getPaymentsStatsController } from '../controllers/stats.controller.js';
import { getKpis } from "../controllers/stats.controller.js";

const router = Router();

router.get('/', getGymStatsController);
router.get('/payments', getPaymentsStatsController);
router.get("/dashboard/kpis", getKpis);

export default router;
