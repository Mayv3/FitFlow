import { supabaseAdmin } from '../db/supabaseClient.js';
import moment from 'moment-timezone';

function getTodayArgentina() {
  return moment().tz('America/Argentina/Buenos_Aires').format('YYYY-MM-DD');
}

async function countTotalMembers(gymId) {
  let q = supabaseAdmin.from('alumnos').select('id', { count: 'exact', head: true }).is('deleted_at', null);;
  if (gymId) q = q.eq('gym_id', gymId);
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

async function countActiveMembers(gymId, today) {
  let q = supabaseAdmin
    .from('alumnos')
    .select('id', { count: 'exact', head: true })
    .gte('fecha_de_vencimiento', today)
    .is('deleted_at', null);
  if (gymId) q = q.eq('gym_id', gymId);
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

async function countMembersWithPlan(gymId) {
  let q = supabaseAdmin
    .from('alumnos')
    .select('id', { count: 'exact', head: true })
    .not('plan_id', 'is', null)
    .is('deleted_at', null);

  if (gymId) q = q.eq('gym_id', gymId);

  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}


async function countTodaysAttendance(gymId, today) {
  let q = supabaseAdmin
    .from('asistencias')
    .select('id, alumnos!inner(id,gym_id)', { count: 'exact', head: true })
    .eq('fecha', today);
  if (gymId) q = q.eq('alumnos.gym_id', gymId);
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

async function getPlansDistribution(gymId) {
  let q = supabaseAdmin
    .from('planes_precios')
    .select('id, nombre, alumnos:alumnos(count)', { head: false });

  if (gymId) {
    q = q
      .eq('gym_id', gymId)
      .eq('alumnos.gym_id', gymId)
      .is('alumnos.deleted_at', null);
  }

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    Plan: row.nombre || `Plan ${row.id}`,
    valor: Array.isArray(row.alumnos) ? row.alumnos.length : 0,
  }));
}

// DASHBOARD


export async function fetchKpis(gymId) {
  const { data, error } = await supabaseAdmin
    .from("mv_dashboard_stats")
    .select("*")
    .eq("gym_id", gymId)
    .single();

  if (error || !data) {
    return {
      range: {
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          .toISOString()
          .split("T")[0],
        to: new Date().toISOString().split("T")[0],
      },
      gym_id: gymId,
      currency: "ARS",
      revenue: {
        current: 0,
        previous: 0,
        deltaPct: 0,
        timeseries: {
          byMonth: [],
          byDay: [],
          byWeek: [],
          byHour: [],
        },
      },
      members: {
        total: 0,
        active: 0,
        inactive: 0,
        altasMes: 0,
        bajasMes: 0,
        activePct: 0,
      },
      avgAttendancePerDay: {
        value: 0,
        deltaPct: 0,
      },
      topPlan: {
        name: null,
        count: 0,
        revenue: 0,
        sharePct: 0,
      },
    };
  }

  return {
    ...data,
    range: {
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split("T")[0],
      to: new Date().toISOString().split("T")[0],
    },
    gym_id: gymId,
    currency: "ARS",
    revenue: {
      current: data.facturacion_mes_actual ?? 0,
      previous: data.facturacion_mes_anterior ?? 0,
      deltaPct:
        data.facturacion_mes_anterior > 0
          ? ((data.facturacion_mes_actual - data.facturacion_mes_anterior) /
            data.facturacion_mes_anterior) *
          100
          : 0,
      timeseries: {
        byMonth: data.por_mes ?? [],
        byDay: data.por_dia ?? [],
        byWeek: data.por_semana ?? [],
        byHour: data.por_hora ?? [],
      },
    },
    members: {
      total: data.alumnos_totales ?? 0,
      active: data.alumnos_activos ?? 0,
      inactive: data.inactivos ?? 0,
      altasMes: data.altas_mes ?? 0,
      bajasMes: data.bajas_mes ?? 0,
      activePct: data.alumnos_totales
        ? Number(((data.alumnos_activos / data.alumnos_totales) * 100).toFixed(1))
        : 0,
    },
    avgAttendancePerDay: {
      value: Number(data.asistencias_promedio?.toFixed(1)) || 0,
      deltaPct: 0,
    },
    topPlan: {
      name: data.plan_mas_vendido ?? null,
      count: data.alumnos_plan_mas_vendido ?? 0,
      revenue: 0,
      sharePct: data.porcentaje_plan_mas_vendido ?? 0,
    },
  };
}


export async function getDashboardData({ gymId }) {
  console.log('Data fetcheada')
  const { data: kpis, error: errorKpis } = await supabaseAdmin
    .from("mv_dashboard_kpis")
    .select("*")
    .eq("gym_id", gymId)
    .single();

  const { data: charts, error: errorCharts } = await supabaseAdmin
    .from("mv_dashboard_charts")
    .select("*")
    .eq("gym_id", gymId)
    .single();

  if (errorKpis || errorCharts || !kpis || !charts) {
    return {
      gym_id: gymId,
      kpis: {
        facturacion: 0,
        alumnos: 0,
        asistencias: 0,
      },
      charts: {
        distribucionEdad: [],
        distribucionSexo: [],
        facturacion: [],
        asistencias: [],
      },
    };
  }

  return {
    gym_id: gymId,
    kpis,
    charts,
  };
}

export async function getDemografiaStatsService({ gymId }) {
  const { data, error } = await supabaseAdmin
    .from('mv_alumnos_demografia')
    .select('*')
    .eq('gym_id', gymId);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getGymStatsService({ gymId } = {}) {
  const today = getTodayArgentina();

  const [
    totalMembers,
    activeMembers,
    withPlanCount,
    todaysAttendance,
    plansDistribution,
  ] = await Promise.all([
    countTotalMembers(gymId),
    countActiveMembers(gymId, today),
    countMembersWithPlan(gymId),
    countTodaysAttendance(gymId, today),
    getPlansDistribution(gymId),
  ]);

  const activePct = Math.floor((activeMembers / totalMembers) * 100);
  const withPlanPct = Math.floor((withPlanCount / totalMembers) * 100);
  const attendancePct = Math.floor((todaysAttendance / activeMembers) * 100);

  return {
    totalMembers,
    activeMembers,
    withPlanCount,
    todaysAttendance,
    plansDistribution,
    activePct,
    withPlanPct,
    attendancePct,
  };
}


export async function getPlanesStatsService({ gymId }) {
  const { data, error } = await supabaseAdmin
    .from("mv_planes_dashboard")
    .select("*")
    .eq("gym_id", gymId);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}