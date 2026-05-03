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
  getActiveMembersPaymentDetailsController,
  getAbandonosDetailsController,
  getAltasDetailsController,
  getPagosByDateRangeController,
} from '../controllers/stats.controller.js';
import { getAsistenciasByGym, getAsistenciasByHora } from '../controllers/attendance.controller.js';
import { requireRole } from '../middleware/requireRole.js';

// OWNER=1, ADMINISTRADOR=2
const adminOnly = requireRole(1, 2);

const router = Router();
router.use(adminOnly);

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
router.get('/dashboard/activos-mes', getActiveMembersPaymentDetailsController);
router.get('/dashboard/abandonos-mes', getAbandonosDetailsController);
router.get('/dashboard/altas-mes', getAltasDetailsController);
router.get('/dashboard/gyms/:gym_id/facturacion/pagos', getPagosByDateRangeController);

export default router;
