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

// PASO 1: Facturación por período (queries directas, sin RPC)
export async function getFacturacionByPeriodo({ gymId, year, range }) {
  const now = moment().tz('America/Argentina/Buenos_Aires');

  if (range === '12m') {
    const { data, error } = await supabaseAdmin
      .from('pagos')
      .select('fecha_de_pago, monto_total')
      .eq('gym_id', gymId)
      .is('deleted_at', null)
      .gte('fecha_de_pago', `${year}-01-01`)
      .lte('fecha_de_pago', `${year}-12-31`);
    if (error) throw error;

    const byMonth = {};
    for (let m = 1; m <= 12; m++) {
      byMonth[m] = { fecha: `${year}-${String(m).padStart(2, '0')}-01`, monto_centavos: 0 };
    }
    for (const p of data ?? []) {
      const m = parseInt(p.fecha_de_pago.slice(5, 7), 10);
      if (byMonth[m]) byMonth[m].monto_centavos += Number(p.monto_total || 0);
    }
    return Object.values(byMonth);
  }

  if (range === '30d') {
    // Días del mes actual que tuvieron facturación (sin ceros)
    const startOfMonth = now.clone().startOf('month').format('YYYY-MM-DD');
    const endOfMonth = now.format('YYYY-MM-DD'); // hasta hoy, no fin de mes futuro
    const { data, error } = await supabaseAdmin
      .from('pagos')
      .select('fecha_de_pago, monto_total')
      .eq('gym_id', gymId)
      .is('deleted_at', null)
      .gte('fecha_de_pago', startOfMonth)
      .lte('fecha_de_pago', endOfMonth);
    if (error) throw error;

    const byDay = {};
    for (const p of data ?? []) {
      const d = p.fecha_de_pago;
      if (!byDay[d]) byDay[d] = { fecha: d, monto_centavos: 0 };
      byDay[d].monto_centavos += Number(p.monto_total || 0);
    }
    return Object.values(byDay).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  if (range === '7w') {
    // Semanas del mes actual (agrupadas por inicio de semana ISO)
    const startOfMonth = now.clone().startOf('month').format('YYYY-MM-DD');
    const endOfMonth = now.format('YYYY-MM-DD');
    const { data, error } = await supabaseAdmin
      .from('pagos')
      .select('fecha_de_pago, monto_total')
      .eq('gym_id', gymId)
      .is('deleted_at', null)
      .gte('fecha_de_pago', startOfMonth)
      .lte('fecha_de_pago', endOfMonth);
    if (error) throw error;

    const byWeek = {};
    for (const p of data ?? []) {
      const ws = moment.tz(p.fecha_de_pago, 'America/Argentina/Buenos_Aires').startOf('isoWeek').format('YYYY-MM-DD');
      if (!byWeek[ws]) byWeek[ws] = { fecha: ws, monto_centavos: 0 };
      byWeek[ws].monto_centavos += Number(p.monto_total || 0);
    }
    return Object.values(byWeek).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  if (range === '24h') {
    const today = now.format('YYYY-MM-DD');
    const { data, error } = await supabaseAdmin
      .from('pagos')
      .select('hora, monto_total')
      .eq('gym_id', gymId)
      .is('deleted_at', null)
      .eq('fecha_de_pago', today);
    if (error) throw error;

    const byHour = {};
    for (let h = 0; h < 24; h++) {
      const hStr = String(h).padStart(2, '0');
      byHour[h] = { fecha: `${today}T${hStr}:00:00`, monto_centavos: 0 };
    }
    for (const p of data ?? []) {
      if (p.hora) {
        const h = parseInt(String(p.hora).slice(0, 2), 10);
        if (byHour[h] !== undefined) byHour[h].monto_centavos += Number(p.monto_total || 0);
      }
    }
    return Object.values(byHour);
  }

  return [];
}

// PASO 2: KPIs filtrados por año
export async function getDashboardDataByYear({ gymId, year }) {
  const [kpisResult, chartsResult] = await Promise.all([
    supabaseAdmin.rpc('dashboard_kpis_by_year', { gym_id_param: gymId, year_param: year }),
    supabaseAdmin.from('mv_dashboard_charts').select('*').eq('gym_id', gymId).single(),
  ]);

  if (kpisResult.error || chartsResult.error || !kpisResult.data || !chartsResult.data) {
    return {
      gym_id: gymId,
      kpis: kpisResult.data ?? {},
      charts: chartsResult.data ?? {},
    };
  }

  return {
    gym_id: gymId,
    kpis: kpisResult.data,
    charts: chartsResult.data,
  };
}

// PASO 3: Demografía filtrada por año de alta (fecha_inicio)
export async function getDemografiaByYear({ gymId, year }) {
  const { data, error } = await supabaseAdmin
    .from('alumnos')
    .select('sexo, fecha_nacimiento')
    .eq('gym_id', gymId)
    .is('deleted_at', null)
    .gte('fecha_inicio', `${year}-01-01`)
    .lte('fecha_inicio', `${year}-12-31`);

  if (error) throw error;

  const currentYear = new Date().getFullYear();

  const rangoEtario = (fechaNacimiento) => {
    if (!fechaNacimiento) return 'Sin datos';
    const edad = currentYear - new Date(fechaNacimiento).getFullYear();
    if (edad <= 12) return '0-12';
    if (edad <= 17) return '13-17';
    if (edad <= 25) return '18-25';
    if (edad <= 35) return '26-35';
    if (edad <= 45) return '36-45';
    if (edad <= 60) return '46-60';
    return '60+';
  };

  const grouped = {};
  for (const row of data ?? []) {
    const sexo = row.sexo || 'Sin datos';
    const rango = rangoEtario(row.fecha_nacimiento);
    const key = `${sexo}_${rango}`;
    if (!grouped[key]) grouped[key] = { sexo, rango_etario: rango, cantidad: 0 };
    grouped[key].cantidad++;
  }

  return Object.values(grouped);
}

// PASO 4: Planes filtrados por año y mes
export async function getPlanesStatsByPeriodo({ gymId, year, month }) {
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  const actualStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const actualEnd = new Date(year, month, 0).toISOString().split('T')[0];
  const prevStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
  const prevEnd = new Date(prevYear, prevMonth, 0).toISOString().split('T')[0];

  const [planesResult, alumnosResult, pagosActualResult, pagosAnteriorResult] = await Promise.all([
    supabaseAdmin.from('planes_precios').select('id, nombre').eq('gym_id', gymId).is('deleted_at', null),
    supabaseAdmin.from('alumnos').select('plan_id').eq('gym_id', gymId).is('deleted_at', null).not('plan_id', 'is', null),
    supabaseAdmin.from('pagos').select('plan_id, monto_total').eq('gym_id', gymId).is('deleted_at', null).not('plan_id', 'is', null).gte('fecha_de_pago', actualStart).lte('fecha_de_pago', actualEnd),
    supabaseAdmin.from('pagos').select('plan_id, monto_total').eq('gym_id', gymId).is('deleted_at', null).not('plan_id', 'is', null).gte('fecha_de_pago', prevStart).lte('fecha_de_pago', prevEnd),
  ]);

  if (planesResult.error) throw planesResult.error;
  if (alumnosResult.error) throw alumnosResult.error;
  if (pagosActualResult.error) throw pagosActualResult.error;
  if (pagosAnteriorResult.error) throw pagosAnteriorResult.error;

  const planes = planesResult.data ?? [];
  if (planes.length === 0) return [];

  const alumnosPorPlan = {};
  for (const a of alumnosResult.data ?? []) {
    alumnosPorPlan[a.plan_id] = (alumnosPorPlan[a.plan_id] || 0) + 1;
  }

  const facturacionActual = {};
  for (const p of pagosActualResult.data ?? []) {
    facturacionActual[p.plan_id] = (facturacionActual[p.plan_id] || 0) + Number(p.monto_total || 0);
  }

  const facturacionAnterior = {};
  for (const p of pagosAnteriorResult.data ?? []) {
    facturacionAnterior[p.plan_id] = (facturacionAnterior[p.plan_id] || 0) + Number(p.monto_total || 0);
  }

  const result = planes.map((plan) => {
    const actual = facturacionActual[plan.id] ?? 0;
    const anterior = facturacionAnterior[plan.id] ?? 0;
    const variacion = anterior > 0 ? ((actual - anterior) / anterior) * 100 : 0;
    return {
      plan_id: plan.id,
      plan_nombre: plan.nombre,
      cantidad_alumnos: alumnosPorPlan[plan.id] ?? 0,
      facturacion_mes_actual: actual,
      facturacion_mes_anterior: anterior,
      variacion: Number(variacion.toFixed(2)),
      is_top5: false,
    };
  });

  const sorted = [...result].sort((a, b) => b.facturacion_mes_actual - a.facturacion_mes_actual);
  const top5Ids = new Set(sorted.slice(0, 5).map((p) => p.plan_id));

  return result.map((p) => ({ ...p, is_top5: top5Ids.has(p.plan_id) }));
}

// Facturación por plan para un mes específico (solo el card de facturación)
export async function getFacturacionPorPlan({ gymId, year, month }) {
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  const actualStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const actualEnd = new Date(year, month, 0).toISOString().split('T')[0];
  const prevStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
  const prevEnd = new Date(prevYear, prevMonth, 0).toISOString().split('T')[0];

  const [planesResult, pagosActualResult, pagosAnteriorResult] = await Promise.all([
    supabaseAdmin.from('planes_precios').select('id, nombre').eq('gym_id', gymId).is('deleted_at', null),
    supabaseAdmin.from('pagos').select('plan_id, monto_total').eq('gym_id', gymId).is('deleted_at', null).not('plan_id', 'is', null).gte('fecha_de_pago', actualStart).lte('fecha_de_pago', actualEnd),
    supabaseAdmin.from('pagos').select('plan_id, monto_total').eq('gym_id', gymId).is('deleted_at', null).not('plan_id', 'is', null).gte('fecha_de_pago', prevStart).lte('fecha_de_pago', prevEnd),
  ]);

  if (planesResult.error) throw planesResult.error;
  if (pagosActualResult.error) throw pagosActualResult.error;
  if (pagosAnteriorResult.error) throw pagosAnteriorResult.error;

  const facturacionActual = {};
  for (const p of pagosActualResult.data ?? []) {
    facturacionActual[p.plan_id] = (facturacionActual[p.plan_id] || 0) + Number(p.monto_total || 0);
  }
  const facturacionAnterior = {};
  for (const p of pagosAnteriorResult.data ?? []) {
    facturacionAnterior[p.plan_id] = (facturacionAnterior[p.plan_id] || 0) + Number(p.monto_total || 0);
  }

  return (planesResult.data ?? []).map((plan) => {
    const actual = facturacionActual[plan.id] ?? 0;
    const anterior = facturacionAnterior[plan.id] ?? 0;
    const variacion = anterior > 0 ? ((actual - anterior) / anterior) * 100 : 0;
    return { plan_id: plan.id, plan_nombre: plan.nombre, actual, anterior, variacion: Number(variacion.toFixed(2)) };
  });
}

// Facturación de un mes específico vs mes anterior (para KPI card)
export async function getFacturacionMes({ gymId, year, month }) {
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  const actualStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const actualEnd = new Date(year, month, 0).toISOString().split('T')[0];
  const prevStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
  const prevEnd = new Date(prevYear, prevMonth, 0).toISOString().split('T')[0];

  const [actualResult, anteriorResult] = await Promise.all([
    supabaseAdmin.from('pagos').select('monto_total').eq('gym_id', gymId).is('deleted_at', null).gte('fecha_de_pago', actualStart).lte('fecha_de_pago', actualEnd),
    supabaseAdmin.from('pagos').select('monto_total').eq('gym_id', gymId).is('deleted_at', null).gte('fecha_de_pago', prevStart).lte('fecha_de_pago', prevEnd),
  ]);

  if (actualResult.error) throw actualResult.error;
  if (anteriorResult.error) throw anteriorResult.error;

  const actual = (actualResult.data ?? []).reduce((sum, p) => sum + Number(p.monto_total || 0), 0);
  const anterior = (anteriorResult.data ?? []).reduce((sum, p) => sum + Number(p.monto_total || 0), 0);
  const deltaPct = anterior > 0 ? Math.round(((actual - anterior) / anterior) * 100) : 0;

  return { actual, anterior, deltaPct };
}