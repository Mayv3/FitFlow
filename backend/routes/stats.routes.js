import { Router } from 'express';
import {
  getAlumnosPorOrigenController,
  getDemografiaStatsController,
  getGymStatsController,
  getPlanesStatsController,
  getPaymentsStatsController,
  getKpis,
  getFacturacionController,
  getFacturacionMesController,
  getFacturacionPorPlanController,
} from '../controllers/stats.controller.js';
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
router.get('/dashboard/gyms/:gym_id/facturacion', getFacturacionController);
router.get('/dashboard/facturacion-mes', getFacturacionMesController);
router.get('/dashboard/planes/facturacion', getFacturacionPorPlanController);

export default router;
