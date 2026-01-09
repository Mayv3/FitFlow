import { Router } from 'express';
import { getAlumnosPorOrigenController, getDemografiaStatsController, getGymStatsController, getPlanesStatsController } from '../controllers/stats.controller.js';
import { getPaymentsStatsController } from '../controllers/stats.controller.js';
import { getKpis } from "../controllers/stats.controller.js";
import { getAsistenciasByGym, getAsistenciasByHora } from '../controllers/attendance.controller.js';

const router = Router();

router.get('/', getGymStatsController);
router.get('/payments', getPaymentsStatsController);
router.get("/dashboard/kpis", getKpis);
router.get('/dashboard/demografia', getDemografiaStatsController);
router.get('/dashboard/planes', getPlanesStatsController);

router.get(
    '/dashboard/gyms/:gym_id/asistencias',
    getAsistenciasByGym
);

router.get(
    '/dashboard/gyms/:gym_id/asistencias/por-hora',
    getAsistenciasByHora
);

router.get('/dashboard/gyms/:gym_id/alumnos/origen', getAlumnosPorOrigenController);

export default router;
