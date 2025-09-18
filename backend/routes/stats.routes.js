import { Router } from 'express';
import { getDemografiaStatsController, getGymStatsController, getPlanesStatsController } from '../controllers/stats.controller.js';
import { getPaymentsStatsController } from '../controllers/stats.controller.js';
import { getKpis } from "../controllers/stats.controller.js";

const router = Router();

router.get('/', getGymStatsController);
router.get('/payments', getPaymentsStatsController);
router.get("/dashboard/kpis", getKpis);
router.get('/dashboard/demografia', getDemografiaStatsController);
router.get('/dashboard/planes', getPlanesStatsController);

export default router;
