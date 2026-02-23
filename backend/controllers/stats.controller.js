import { supabaseAdmin } from '../db/supabaseClient.js';
import { getPaymentsStatsService } from '../services/paymentsStats.supabase.js';
import { getDashboardData, getDemografiaStatsService, getGymStatsService, getPlanesStatsService } from '../services/stats.supabase.js';

export async function getGymStatsController(req, res) {
  try {
    const gymId =
      typeof req.query.gymId === 'string' && req.query.gymId.trim()
        ? req.query.gymId.trim()
        : undefined;

    const stats = await getGymStatsService({ gymId });
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
    const gymId = req.query.gymId || null;
    const fromDate = req.query.fromDate || null;
    const toDate = req.query.toDate || null;

    const result = await getPaymentsStatsService({ gymId, fromDate, toDate });
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

    const dashboardData = await getDashboardData({ gymId });

    return res.json(dashboardData);
  } catch (error) {
    console.error("❌ Error en getKpis:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

export async function getDemografiaStatsController(req, res) {
  try {
    const gymId = req.user?.user_metadata?.gym_id;

    if (!gymId) {
      return res.status(400).json({ error: "Falta gym_id" });
    }

    const rawData = await getDemografiaStatsService({ gymId }) || [];

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

    return res.json({
      porSexo: porSexo || [],
      porEdad: porEdad || [],
    });
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

    const rawData = await getPlanesStatsService({ gymId });

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

    return res.json({ top5, alumnos, facturacion });
  } catch (error) {
    console.error("❌ Error en getPlanesStats:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

export const getAlumnosPorOrigenController = async (req, res) => {
  const { gym_id } = req.params;
  const { year, month } = req.query;

  if (!year || !month) {
    return res.status(400).json({
      error: 'Parámetros requeridos: year y month'
    });
  }

  try {
    const { data, error } = await supabaseAdmin.rpc(
      'alumnos_por_origen_por_mes',
      {
        gym_id_param: gym_id,
        year_param: Number(year),
        month_param: Number(month),
      }
    );

    if (error) throw error;

    res.json({
      gym_id,
      year: Number(year),
      month: Number(month),
      items: data ?? [],
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};