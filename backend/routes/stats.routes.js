import { Router } from 'express';
import { getDemografiaStatsController, getGymStatsController, getPlanesStatsController } from '../controllers/stats.controller.js';
import { getPaymentsStatsController } from '../controllers/stats.controller.js';
import { getKpis } from "../controllers/stats.controller.js";
import { getAsistenciasHoyByGym, getAsistenciasHoyByHora } from '../controllers/attendance.controller.js';

const router = Router();

router.get('/', getGymStatsController);
router.get('/payments', getPaymentsStatsController);
router.get("/dashboard/kpis", getKpis);
router.get('/dashboard/demografia', getDemografiaStatsController);
router.get('/dashboard/planes', getPlanesStatsController);
router.get('/dashboard/gyms/:gym_id/asistencias/hoy', getAsistenciasHoyByGym);
router.get('/dashboard/gyms/:gym_id/asistencias/hoy/por-hora', getAsistenciasHoyByHora);

export default router;
