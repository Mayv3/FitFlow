import { supabaseAdmin } from '../config/supabaseClient.js';
import moment from 'moment-timezone';
import { fetchAllPaged } from '../utilities/fetchAllPaged.js';

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


async function countMonthRenewals(gymId) {
  const now = moment().tz('America/Argentina/Buenos_Aires');
  const start = now.clone().startOf('month').format('YYYY-MM-DD');
  const end = now.format('YYYY-MM-DD');

  const data = await fetchAllPaged(() =>
    supabaseAdmin
      .from('pagos')
      .select('alumno_id')
      .eq('gym_id', gymId)
      .is('deleted_at', null)
      .gte('fecha_de_pago', start)
      .lte('fecha_de_pago', end)
      .order('id')
  );

  const uniqueIds = new Set(data.map(p => p.alumno_id));
  return uniqueIds.size;
}

async function countTodaysAttendance(gymId, today) {
  // asistencias ya tiene gym_id: no hace falta el join con alumnos.
  let q = supabaseAdmin
    .from('asistencias')
    .select('id', { count: 'exact', head: true })
    .eq('fecha', today);
  if (gymId) q = q.eq('gym_id', gymId);
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
    // `alumnos(count)` llega como [{ count: N }]: el largo del array siempre es 1.
    valor: row.alumnos?.[0]?.count ?? 0,
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
    monthRenewals,
  ] = await Promise.all([
    countTotalMembers(gymId),
    countActiveMembers(gymId, today),
    countMembersWithPlan(gymId),
    countTodaysAttendance(gymId, today),
    getPlansDistribution(gymId),
    countMonthRenewals(gymId),
  ]);

  // Gym sin alumnos (o sin activos): 0% en vez de NaN/Infinity.
  const pct = (part, total) => (total > 0 ? Math.floor((part / total) * 100) : 0);
  const activePct = pct(activeMembers, totalMembers);
  const withPlanPct = pct(withPlanCount, totalMembers);
  const attendancePct = pct(todaysAttendance, activeMembers);
  const renewalsPct = pct(monthRenewals, totalMembers);

  return {
    totalMembers,
    activeMembers,
    withPlanCount,
    monthRenewals,
    todaysAttendance,
    plansDistribution,
    activePct,
    withPlanPct,
    attendancePct,
    renewalsPct,
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

// PASO 1: Facturación por período. Agrupa en la DB (RPC facturacion_por_periodo);
// antes traía todos los pagos del período + sus items y sumaba acá.
export async function getFacturacionByPeriodo({ gymId, year, range }) {
  const now = moment().tz('America/Argentina/Buenos_Aires');
  const hoy = now.format('YYYY-MM-DD');
  const inicioMes = now.clone().startOf('month').format('YYYY-MM-DD');

  const config = {
    '12m': { desde: `${year}-01-01`, hasta: `${year}-12-31`, granularidad: 'month' },
    '30d': { desde: inicioMes, hasta: hoy, granularidad: 'day' },
    '7w': { desde: inicioMes, hasta: hoy, granularidad: 'week' },
    '24h': { desde: hoy, hasta: hoy, granularidad: 'hour' },
  }[range];
  if (!config) return [];

  const { data, error } = await supabaseAdmin.rpc('facturacion_por_periodo', {
    p_gym_id: gymId,
    p_desde: config.desde,
    p_hasta: config.hasta,
    p_granularidad: config.granularidad,
  });
  if (error) throw error;
  // Sin ningún pago en el rango el frontend espera [] (no buckets en 0).
  if (!data?.length) return [];

  const porPeriodo = new Map(data.map((r) => [r.periodo, r]));
  const fila = (fecha, r) => ({
    fecha,
    monto_centavos: Number(r?.monto ?? 0),
    metodos: normalizarMetodos(r?.metodos),
  });

  // 12m y 24h devuelven todos los buckets (meses/horas sin pagos en 0)
  if (range === '12m') {
    return Array.from({ length: 12 }, (_, i) => {
      const mm = String(i + 1).padStart(2, '0');
      return fila(`${year}-${mm}-01`, porPeriodo.get(`${year}-${mm}`));
    });
  }
  if (range === '24h') {
    return Array.from({ length: 24 }, (_, h) => {
      const hh = String(h).padStart(2, '0');
      return fila(`${hoy}T${hh}:00:00`, porPeriodo.get(hh));
    });
  }
  // 30d / 7w: solo los días/semanas con pagos
  return data
    .map((r) => fila(r.periodo, r))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

function normalizarMetodos(metodos) {
  const out = {};
  for (const [nombre, v] of Object.entries(metodos ?? {})) {
    out[nombre] = { count: Number(v.count), total: Number(v.total) };
  }
  if (Object.keys(out).length === 0) out['Sin método'] = { count: 0, total: 0 };
  return out;
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
  const data = await fetchAllPaged(() =>
    supabaseAdmin
      .from('alumnos')
      .select('sexo, fecha_nacimiento')
      .eq('gym_id', gymId)
      .is('deleted_at', null)
      .gte('fecha_inicio', `${year}-01-01`)
      .lte('fecha_inicio', `${year}-12-31`)
      .order('id')
  );

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

// Suma de monto_total por plan_id en un rango de fechas de pago → { [plan_id]: total }
async function sumPagosPorPlan(gymId, desde, hasta) {
  const pagos = await fetchAllPaged(() =>
    supabaseAdmin
      .from('pagos')
      .select('plan_id, monto_total')
      .eq('gym_id', gymId)
      .is('deleted_at', null)
      .not('plan_id', 'is', null)
      .gte('fecha_de_pago', desde)
      .lte('fecha_de_pago', hasta)
      .order('id')
  );
  const totales = {};
  for (const p of pagos) {
    totales[p.plan_id] = (totales[p.plan_id] || 0) + Number(p.monto_total || 0);
  }
  return totales;
}

// PASO 4: Planes filtrados por año y mes
export async function getPlanesStatsByPeriodo({ gymId, year, month }) {
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  const actualStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const actualEnd = new Date(year, month, 0).toISOString().split('T')[0];
  const prevStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
  const prevEnd = new Date(prevYear, prevMonth, 0).toISOString().split('T')[0];

  const [planesResult, alumnos, facturacionActual, facturacionAnterior] = await Promise.all([
    supabaseAdmin.from('planes_precios').select('id, nombre').eq('gym_id', gymId).is('deleted_at', null),
    fetchAllPaged(() =>
      supabaseAdmin.from('alumnos').select('plan_id').eq('gym_id', gymId).is('deleted_at', null).not('plan_id', 'is', null).order('id')
    ),
    sumPagosPorPlan(gymId, actualStart, actualEnd),
    sumPagosPorPlan(gymId, prevStart, prevEnd),
  ]);

  if (planesResult.error) throw planesResult.error;

  const planes = planesResult.data ?? [];
  if (planes.length === 0) return [];

  const alumnosPorPlan = {};
  for (const a of alumnos) {
    alumnosPorPlan[a.plan_id] = (alumnosPorPlan[a.plan_id] || 0) + 1;
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

  const [planesResult, facturacionActual, facturacionAnterior] = await Promise.all([
    supabaseAdmin.from('planes_precios').select('id, nombre').eq('gym_id', gymId).is('deleted_at', null),
    sumPagosPorPlan(gymId, actualStart, actualEnd),
    sumPagosPorPlan(gymId, prevStart, prevEnd),
  ]);

  if (planesResult.error) throw planesResult.error;

  return (planesResult.data ?? []).map((plan) => {
    const actual = facturacionActual[plan.id] ?? 0;
    const anterior = facturacionAnterior[plan.id] ?? 0;
    const variacion = anterior > 0 ? ((actual - anterior) / anterior) * 100 : 0;
    return { plan_id: plan.id, plan_nombre: plan.nombre, actual, anterior, variacion: Number(variacion.toFixed(2)) };
  });
}

export async function countActiveMembersByMonthPayment({ gymId, year, month }) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  const data = await fetchAllPaged(() =>
    supabaseAdmin
      .from('pagos')
      .select('alumno_id')
      .eq('gym_id', gymId)
      .is('deleted_at', null)
      .gte('fecha_de_pago', startDate)
      .lte('fecha_de_pago', endDate)
      .order('id')
  );

  const uniqueIds = new Set(data.map(p => p.alumno_id));
  return uniqueIds.size;
}

function getMonthRange(year, month) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = new Date(year, month, 0).toISOString().split('T')[0];
  return { startDate: start, endDate: end };
}

const todayStr = () => new Date().toISOString().split('T')[0];

export async function countAbandonosByMonth({ gymId, year, month }) {
  const { startDate, endDate } = getMonthRange(year, month);

  const { count, error } = await supabaseAdmin
    .from('alumnos')
    .select('id', { count: 'exact', head: true })
    .eq('gym_id', gymId)
    .is('deleted_at', null)
    .gte('fecha_de_vencimiento', startDate)
    .lte('fecha_de_vencimiento', endDate)
    .lte('fecha_de_vencimiento', todayStr());

  if (error) throw error;
  return count ?? 0;
}

export async function getAbandonosDetails({ gymId, year, month }) {
  const { startDate, endDate } = getMonthRange(year, month);

  const data = await fetchAllPaged(() =>
    supabaseAdmin
      .from('alumnos')
      .select('id, nombre, fecha_de_vencimiento, plan_id, planes_precios(nombre)')
      .eq('gym_id', gymId)
      .is('deleted_at', null)
      .gte('fecha_de_vencimiento', startDate)
      .lte('fecha_de_vencimiento', endDate)
      .lte('fecha_de_vencimiento', todayStr())
      .order('fecha_de_vencimiento', { ascending: false })
      .order('id')
  );

  return data.map((a) => ({
    id: a.id,
    alumno_nombre: a.nombre ?? 'Sin nombre',
    fecha_de_vencimiento: a.fecha_de_vencimiento,
    plan_actual: a.planes_precios?.nombre ?? 'Sin plan',
  }));
}

export async function getActiveMembersPaymentDetails({ gymId, year, month }) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  const data = await fetchAllPaged(() =>
    supabaseAdmin
      .from('pagos')
      .select(`
        id,
        alumno_id,
        fecha_de_pago,
        monto_total,
        hora,
        plan_id,
        alumnos!inner(id, nombre),
        planes_precios(nombre)
      `)
      .eq('gym_id', gymId)
      .is('deleted_at', null)
      .gte('fecha_de_pago', startDate)
      .lte('fecha_de_pago', endDate)
      .order('fecha_de_pago', { ascending: false })
      .order('hora', { ascending: false })
      .order('id', { ascending: false })
  );

  return data.map((p) => ({
    id: p.id,
    alumno_id: p.alumno_id,
    alumno_nombre: p.alumnos?.nombre ?? 'Sin nombre',
    fecha_de_pago: p.fecha_de_pago,
    monto_total: p.monto_total,
    hora: p.hora,
    plan_id: p.plan_id,
    plan_nombre: p.planes_precios?.nombre ?? '—',
  }));
}

export async function countAltasByMonth({ gymId, year, month }) {
  const { startDate, endDate } = getMonthRange(year, month);

  const { count, error } = await supabaseAdmin
    .from('alumnos')
    .select('id', { count: 'exact', head: true })
    .eq('gym_id', gymId)
    .is('deleted_at', null)
    .gte('fecha_inicio', startDate)
    .lte('fecha_inicio', endDate);

  if (error) throw error;
  return count ?? 0;
}

export async function getAltasDetails({ gymId, year, month }) {
  const { startDate, endDate } = getMonthRange(year, month);

  const data = await fetchAllPaged(() =>
    supabaseAdmin
      .from('alumnos')
      .select('id, nombre, fecha_inicio, planes_precios(nombre)')
      .eq('gym_id', gymId)
      .is('deleted_at', null)
      .gte('fecha_inicio', startDate)
      .lte('fecha_inicio', endDate)
      .order('fecha_inicio', { ascending: false })
      .order('id')
  );

  return data.map((a) => ({
    id: a.id,
    alumno_nombre: a.nombre ?? 'Sin nombre',
    fecha_inicio: a.fecha_inicio,
    plan: a.planes_precios?.nombre ?? 'Sin plan',
  }));
}

// Facturación de un mes específico vs mes anterior (para KPI card)
export async function getFacturacionMes({ gymId, year, month }) {
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  const actualStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const actualEnd = new Date(year, month, 0).toISOString().split('T')[0];
  const prevStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
  const prevEnd = new Date(prevYear, prevMonth, 0).toISOString().split('T')[0];

  const [actualData, anteriorData] = await Promise.all([
    fetchAllPaged(() =>
      supabaseAdmin.from('pagos').select('monto_total').eq('gym_id', gymId).is('deleted_at', null).gte('fecha_de_pago', actualStart).lte('fecha_de_pago', actualEnd).order('id')
    ),
    fetchAllPaged(() =>
      supabaseAdmin.from('pagos').select('monto_total').eq('gym_id', gymId).is('deleted_at', null).gte('fecha_de_pago', prevStart).lte('fecha_de_pago', prevEnd).order('id')
    ),
  ]);

  const actual = actualData.reduce((sum, p) => sum + Number(p.monto_total || 0), 0);
  const anterior = anteriorData.reduce((sum, p) => sum + Number(p.monto_total || 0), 0);
  const deltaPct = anterior > 0 ? Math.round(((actual - anterior) / anterior) * 100) : 0;

  return { actual, anterior, deltaPct };
}

export async function getPagosByDateRange({ gymId, startDate, endDate }) {
  const data = await fetchAllPaged(() =>
    supabaseAdmin
      .from('pagos')
      .select(`
        id, fecha_de_pago, hora, monto_total,
        alumno:alumnos!inner(nombre),
        plan:planes_precios!left(nombre),
        items:pago_items(monto, metodo_id:metodo_de_pago_id, metodo:metodos_de_pago(nombre))
      `)
      .eq('gym_id', gymId)
      .is('deleted_at', null)
      .gte('fecha_de_pago', startDate)
      .lte('fecha_de_pago', endDate)
      .order('fecha_de_pago', { ascending: false })
      .order('hora', { ascending: false })
      .order('id', { ascending: false })
  );

  return data.map((p) => ({
    id: p.id,
    fecha_de_pago: p.fecha_de_pago,
    hora: p.hora,
    monto_total: p.monto_total,
    alumno_nombre: p.alumno?.nombre ?? '',
    plan_nombre: p.plan?.nombre ?? null,
    items: (p.items ?? []).map((item) => ({
      monto: item.monto,
      metodo: item.metodo?.nombre ?? 'Sin método',
    })),
  }));
}