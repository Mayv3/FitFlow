import { supabaseAdmin } from '../config/supabaseClient.js';
import * as cache from '../utilities/cache.js'
import { getPaymentsStatsService } from '../services/paymentsStats.supabase.js';
import {
  getDashboardData,
  getDashboardDataByYear,
  getDemografiaStatsService,
  getDemografiaByYear,
  getGymStatsService,
  getPlanesStatsByPeriodo,
  getFacturacionByPeriodo,
  getFacturacionPorPlan,
  getFacturacionMes,
  countActiveMembersByMonthPayment,
  getActiveMembersPaymentDetails,
  countAbandonosByMonth,
  getAbandonosDetails,
  countAltasByMonth,
  getAltasDetails,
  getPagosByDateRange,

} from '../services/stats.supabase.js';
import { getOwnerGymStats } from '../services/gyms.supabase.js';

// Owner: estadísticas generales de un gimnasio filtradas por mes (?month=YYYY-MM)
export async function getOwnerGymOverviewController(req, res) {
  try {
    const { gym_id } = req.params;
    const { month } = req.query;
    if (!gym_id) return res.status(400).json({ error: 'gym_id requerido' });
    const data = await getOwnerGymStats(gym_id, month);
    return res.status(200).json(data);
  } catch (err) {
    console.error('[GET owner gym stats] Error:', err);
    return res.status(500).json({ error: 'No se pudieron obtener las estadísticas' });
  }
}

export async function getGymStatsController(req, res) {
  try {
    const gymId = req.gymId;

    const key = `stats:gym:${gymId}`
    const cached = await cache.get(key)
    if (cached) return res.status(200).json(cached)

    const stats = await getGymStatsService({ gymId });
    await cache.set(key, stats, 600)
    return res.status(200).json(stats);
  } catch (err) {
    console.error('[GET /stats] Error:', err);
    return res
      .status(500)
      .json({ message: 'No se pudieron obtener las estadísticas' });
  }
}

export async function getPaymentsStatsController(req, res) {
  try {
    const gymId = req.gymId;
    const fromDate = req.query.fromDate || null;
    const toDate = req.query.toDate || null;

    const key = `stats:payments:${gymId}:${fromDate}:${toDate}`
    const cached = await cache.get(key)
    if (cached) return res.json(cached)

    const result = await getPaymentsStatsService({ gymId, fromDate, toDate });
    await cache.set(key, result, 600)
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getKpis(req, res) {
  try {
    const gymId = req.user?.user_metadata?.gym_id;
    if (!gymId) {
      return res.status(400).json({ error: "Falta gym_id" });
    }

    const currentYear = new Date().getFullYear();
    const year = req.query.year ? Number(req.query.year) : currentYear;
    const month = req.query.month ? Number(req.query.month) : null;

    const key = `stats:kpis:${gymId}:${year}:${month ?? 'all'}`
    const cached = await cache.get(key)
    if (cached) return res.json(cached)

    const dashboardData = !month || year === currentYear
      ? await getDashboardData({ gymId })
      : await getDashboardDataByYear({ gymId, year });

    if (month && month >= 1 && month <= 12) {
      const [activosPorPago, abandonos, altas] = await Promise.all([
        countActiveMembersByMonthPayment({ gymId, year, month }),
        countAbandonosByMonth({ gymId, year, month }),
        countAltasByMonth({ gymId, year, month }),
      ]);
      dashboardData.charts = {
        ...dashboardData.charts,
        activos: activosPorPago,
        bajas: abandonos,
        altas_mes: altas,
      };
    }

    await cache.set(key, dashboardData, 600)
    return res.json(dashboardData);
  } catch (error) {
    console.error("❌ Error en getKpis:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

export async function getActiveMembersPaymentDetailsController(req, res) {
  try {
    const gymId = req.user?.user_metadata?.gym_id;
    if (!gymId) return res.status(400).json({ error: "Falta gym_id" });

    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
    const month = req.query.month ? Number(req.query.month) : null;

    if (!month || month < 1 || month > 12) {
      return res.status(400).json({ error: "month es requerido (1-12)" });
    }

    const items = await getActiveMembersPaymentDetails({ gymId, year, month });
    return res.json({ gym_id: gymId, year, month, total: items.length, items });
  } catch (error) {
    console.error("❌ Error en getActiveMembersPaymentDetails:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

export async function getAbandonosDetailsController(req, res) {
  try {
    const gymId = req.user?.user_metadata?.gym_id;
    if (!gymId) return res.status(400).json({ error: "Falta gym_id" });

    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
    const month = req.query.month ? Number(req.query.month) : null;

    if (!month || month < 1 || month > 12) {
      return res.status(400).json({ error: "month es requerido (1-12)" });
    }

    const items = await getAbandonosDetails({ gymId, year, month });
    return res.json({ gym_id: gymId, year, month, total: items.length, items });
  } catch (error) {
    console.error("❌ Error en getAbandonosDetails:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

export async function getAltasDetailsController(req, res) {
  try {
    const gymId = req.user?.user_metadata?.gym_id;
    if (!gymId) return res.status(400).json({ error: "Falta gym_id" });

    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
    const month = req.query.month ? Number(req.query.month) : null;

    if (!month || month < 1 || month > 12) {
      return res.status(400).json({ error: "month es requerido (1-12)" });
    }

    const items = await getAltasDetails({ gymId, year, month });
    return res.json({ gym_id: gymId, year, month, total: items.length, items });
  } catch (error) {
    console.error("❌ Error en getAltasDetails:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

export async function getDemografiaStatsController(req, res) {
  try {
    const gymId = req.user?.user_metadata?.gym_id;

    if (!gymId) {
      return res.status(400).json({ error: "Falta gym_id" });
    }

    const year = req.query.year ? Number(req.query.year) : null;

    const key = `stats:demografia:${gymId}:${year}`
    const cached = await cache.get(key)
    if (cached) return res.json(cached)

    const rawData = year
      ? await getDemografiaByYear({ gymId, year }) || []
      : await getDemografiaStatsService({ gymId }) || [];

    const porSexo = rawData.reduce((acc, item) => {
      const existing = acc.find((s) => s.sexo === item.sexo);
      if (existing) {
        existing.cantidad += item.cantidad;
      } else {
        acc.push({ sexo: item.sexo, cantidad: item.cantidad });
      }
      return acc;
    }, []);

    const porEdad = rawData.map((item) => ({
      rango_etario: item.rango_etario,
      sexo: item.sexo,
      cantidad: item.cantidad,
    }));

    const result = { porSexo: porSexo || [], porEdad: porEdad || [] }
    await cache.set(key, result, 600)
    return res.json(result);
  } catch (error) {
    console.error("❌ Error en getDemografiaStats:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

export async function getPlanesStatsController(req, res) {
  try {
    const gymId = req.user?.user_metadata?.gym_id;

    if (!gymId) {
      return res.status(400).json({ error: "Falta gym_id" });
    }

    const now = new Date();
    const year = req.query.year ? Number(req.query.year) : now.getFullYear();
    const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1;

    const key = `stats:planes:${gymId}:${year}:${month}`
    const cached = await cache.get(key)
    if (cached) return res.json(cached)

    const rawData = await getPlanesStatsByPeriodo({ gymId, year, month });

    const top5 = rawData.filter((p) => p.is_top5 === true);
    const alumnos = rawData.map((p) => ({
      plan_id: p.plan_id,
      plan_nombre: p.plan_nombre,
      cantidad_alumnos: p.cantidad_alumnos,
    }));
    const facturacion = rawData.map((p) => ({
      plan_id: p.plan_id,
      plan_nombre: p.plan_nombre,
      actual: p.facturacion_mes_actual,
      anterior: p.facturacion_mes_anterior,
      variacion: p.variacion,
    }));

    const result = { top5, alumnos, facturacion }
    await cache.set(key, result, 600)
    return res.json(result);
  } catch (error) {
    console.error("❌ Error en getPlanesStats:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

export const getAlumnosPorOrigenController = async (req, res) => {
  const gym_id = req.gymId;
  const { year, month } = req.query;

  if (!year || month === undefined || month === null) {
    return res.status(400).json({
      error: 'Parámetros requeridos: year y month'
    });
  }

  const yearNum = Number(year);
  const monthNum = Number(month);

  try {
    const key = `stats:origen:${gym_id}:${yearNum}:${monthNum}`
    const cached = await cache.get(key)
    if (cached) return res.json(cached)

    let items;

    if (monthNum === 0) {
      // Todo el año: agrupar alumnos por origen filtrando por año de alta
      const { data, error } = await supabaseAdmin
        .from('alumnos')
        .select('origen')
        .eq('gym_id', gym_id)
        .is('deleted_at', null)
        .gte('fecha_inicio', `${yearNum}-01-01`)
        .lte('fecha_inicio', `${yearNum}-12-31`);

      if (error) throw error;

      const grouped = {};
      for (const a of data ?? []) {
        const origen = a.origen || 'Sin datos';
        grouped[origen] = (grouped[origen] || 0) + 1;
      }

      items = Object.entries(grouped).map(([origen, total]) => ({ origen, total }));
    } else {
      const { data, error } = await supabaseAdmin.rpc(
        'alumnos_por_origen_por_mes',
        {
          gym_id_param: gym_id,
          year_param: yearNum,
          month_param: monthNum,
        }
      );

      if (error) throw error;
      items = data ?? [];
    }

    const result = { gym_id, year: yearNum, month: monthNum, items }
    await cache.set(key, result, 600)
    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

// Facturación por plan: solo el card de facturación (no afecta top5 ni alumnos)
export async function getFacturacionPorPlanController(req, res) {
  try {
    const gymId = req.user?.user_metadata?.gym_id;
    if (!gymId) return res.status(400).json({ error: 'Falta gym_id' });

    const now = new Date();
    const year = req.query.year ? Number(req.query.year) : now.getFullYear();
    const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1;

    const key = `stats:facturacion-plan:${gymId}:${year}:${month}`
    const cached = await cache.get(key)
    if (cached) return res.json(cached)

    const data = await getFacturacionPorPlan({ gymId, year, month });
    await cache.set(key, data, 600)
    return res.json(data);
  } catch (error) {
    console.error('❌ Error en getFacturacionPorPlan:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// KPI Facturación: mes específico vs mes anterior
export async function getFacturacionMesController(req, res) {
  try {
    const gymId = req.user?.user_metadata?.gym_id;
    if (!gymId) return res.status(400).json({ error: 'Falta gym_id' });

    const now = new Date();
    const year = req.query.year ? Number(req.query.year) : now.getFullYear();
    const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1;

    const key = `stats:facturacion-mes:${gymId}:${year}:${month}`
    const cached = await cache.get(key)
    if (cached) return res.json(cached)

    const result = await getFacturacionMes({ gymId, year, month });
    await cache.set(key, result, 600)
    return res.json(result);
  } catch (error) {
    console.error('❌ Error en getFacturacionMes:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// PASO 1: Controller para facturación por período
export async function getFacturacionController(req, res) {
  try {
    const gym_id = req.gymId;
    const { year, range } = req.query;

    const validRanges = ['12m', '30d', '7w', '24h'];
    if (!range || !validRanges.includes(range)) {
      return res.status(400).json({ error: 'range debe ser uno de: 12m, 30d, 7w, 24h' });
    }

    const yearNum = year ? Number(year) : new Date().getFullYear();

    const key = `stats:facturacion:v2:${gym_id}:${yearNum}:${range}`
    const cached = await cache.get(key)
    if (cached) return res.json(cached)

    const items = await getFacturacionByPeriodo({ gymId: gym_id, year: yearNum, range });
    const result = { gym_id, year: yearNum, range, items }
    await cache.set(key, result, 600)
    return res.json(result);
  } catch (error) {
    console.error('❌ Error en getFacturacion:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function getPagosByDateRangeController(req, res) {
  try {
    const gym_id = req.gymId;
    if (!gym_id) return res.status(400).json({ error: 'Falta gym_id' });

    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate y endDate son requeridos' });
    }

    const items = await getPagosByDateRange({ gymId: gym_id, startDate, endDate });
    return res.json({ gym_id, startDate, endDate, total: items.length, items });
  } catch (error) {
    console.error('❌ Error en getPagosByDateRange:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}