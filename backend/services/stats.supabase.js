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
    .gte('fecha_de_vencimiento', today);
  if (gymId) q = q.eq('gym_id', gymId);
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

async function countMembersWithPlan(gymId) {
  let q = supabaseAdmin
    .from('alumnos')
    .select('id', { count: 'exact', head: true })
    .not('plan_id', 'is', null);
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
      .eq('alumnos.gym_id', gymId);
  }

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    Plan: row.nombre || `Plan ${row.id}`,
    valor: Number(row.alumnos?.[0]?.count ?? 0),
  }));
}

// DASHBOARD


export async function fetchKpis(gymId) {
  const { data, error } = await supabaseAdmin
    .from("mv_dashboard_stats")
    .select("*")
    .eq("gym_id", gymId)
    .single();

  if (error) throw error;

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
      current: data.facturacion_mes_actual,
      previous: data.facturacion_mes_anterior,
      deltaPct: ((data.facturacion_mes_actual - data.facturacion_mes_anterior) / data.facturacion_mes_anterior) * 100,
    },
    activeMembers: {
      count: data.alumnos_activos,
      deltaPct: Number(((data.alumnos_activos / data.alumnos_totales) * 100).toFixed(1)),
    },
    avgAttendancePerDay: {
      value: Number(data.asistencias_promedio?.toFixed(1)),
      deltaPct: 0,
    },
    topPlan: {
      name: data.plan_mas_vendido,
      count: data.alumnos_plan_mas_vendido,
      revenue: null,
      sharePct: data.porcentaje_plan_mas_vendido,
    },
  };
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

  const withPlanPct = totalMembers === 0 ? 0 : Math.round((withPlanCount * 100) / totalMembers);

  return {
    totalMembers,
    activeMembers,
    todaysAttendance,
    withPlanPct,
    plansDistribution,
  };
}

