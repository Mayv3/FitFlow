import { supabaseAdmin } from '../config/supabaseClient.js'

export async function createGym({ name, settings = {}, logo_url = null }) {
  const { data, error } = await supabaseAdmin
    .from('gyms')
    .insert({ name, logo_url, settings })
    .select('id, name, logo_url, settings')
    .single()

  if (error) throw error
  return data
}

export async function listGyms() {
  const { data, error } = await supabaseAdmin
    .from('gyms')
    .select('id, name, logo_url, settings')
    .is('deleted_at', null)

  if (error) throw error
  return data
}

export async function listDeletedGyms() {
  const { data, error } = await supabaseAdmin
    .from('gyms')
    .select('id, name, logo_url, settings, deleted_at')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })

  if (error) throw error
  return data
}

export async function softDeleteGym(gymId) {
  const { data, error } = await supabaseAdmin
    .from('gyms')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', gymId)
    .select('id, name, deleted_at')
    .single()

  if (error) throw error
  return data
}

export async function restoreGym(gymId) {
  const { data, error } = await supabaseAdmin
    .from('gyms')
    .update({ deleted_at: null })
    .eq('id', gymId)
    .select('id, name')
    .single()

  if (error) throw error
  return data
}

export async function updateGym(gymId, updates) {
  const { data, error } = await supabaseAdmin
    .from('gyms')
    .update(updates)
    .eq('id', gymId)
    .select('id, name, logo_url, settings')
    .single()

  if (error) throw error
  return data
}

export async function listGymSubscriptions(gymId, { onlyActive = false } = {}) {
  let query = supabaseAdmin
    .from('suscriptions')
    .select('id, gym_id, plan_id, is_active, start_at, end_at, created_at, updated_at')
    .eq('gym_id', gymId)

  if (onlyActive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export const getGymOverview = async (gymId) => {
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

  /* =========================
     ALUMNOS
  ========================== */
  const { data: alumnos } = await supabaseAdmin
    .from('alumnos')
    .select('id, fecha_de_vencimiento')
    .eq('gym_id', gymId)
    .is('deleted_at', null);

  const totalAlumnos = alumnos?.length || 0;
  const alumnosActivos = alumnos?.filter(a =>
    a.fecha_de_vencimiento && new Date(a.fecha_de_vencimiento) >= hoy
  ).length || 0;

  const alumnosVencidos = totalAlumnos - alumnosActivos;

  /* =========================
     PLANES
  ========================== */
  const { count: totalPlanes } = await supabaseAdmin
    .from('planes_precios')
    .select('*', { count: 'exact', head: true })
    .eq('gym_id', gymId)
    .is('deleted_at', null);

  /* =========================
     TURNOS DEL MES
  ========================== */
  const { count: turnosMes } = await supabaseAdmin
    .from('turnos')
    .select('*', { count: 'exact', head: true })
    .eq('gym_id', gymId)
    .gte('inicio_at', inicioMes.toISOString())
    .lte('inicio_at', finMes.toISOString());

  /* =========================
     PAGOS DEL MES
  ========================== */
  const { data: pagosMes } = await supabaseAdmin
    .from('pagos')
    .select('monto_total')
    .eq('gym_id', gymId)
    .gte('fecha_de_pago', inicioMes.toISOString())
    .lte('fecha_de_pago', finMes.toISOString())
    .is('deleted_at', null);

  const totalPagosMes = pagosMes?.reduce(
    (sum, p) => sum + Number(p.monto_total || 0),
    0
  ) || 0;

  /* =========================
     SERVICIOS
  ========================== */
  const { count: totalServicios } = await supabaseAdmin
    .from('servicios')
    .select('*', { count: 'exact', head: true })
    .eq('gym_id', gymId)
    .is('deleted_at', null);

  /* =========================
     USUARIOS DEL GYM
  ========================== */
  const { data: users } = await supabaseAdmin
    .from('users')
    .select(`
      id,
      name,
      email,
      role_id,
      roles ( name )
    `)
    .eq('gym_id', gymId)
    .is('deleted_at', null);

  return {
    gym: {
      id: gymId,
    },

    alumnos: {
      total: totalAlumnos,
      activos: alumnosActivos,
      vencidos: alumnosVencidos,
    },

    planes: {
      total: totalPlanes || 0,
    },

    turnos: {
      mes_actual: turnosMes || 0,
    },

    pagos: {
      mes_actual: {
        cantidad: pagosMes?.length || 0,
        total: totalPagosMes,
      },
    },

    servicios: {
      total: totalServicios || 0,
    },

    usuarios: users || [],
  };
};

/**
 * Owner: estadísticas generales de UN gimnasio, filtradas por mes.
 * month = 'YYYY-MM' (default: mes actual).
 * - alumnos: snapshot actual (total/activos/vencidos) + altas del mes (fecha_inicio en el mes)
 * - facturacion: pagos del mes (total $ + cantidad)
 */
export const getOwnerGymStats = async (gymId, month) => {
  const now = new Date();
  const valid = typeof month === 'string' && /^\d{4}-\d{2}$/.test(month);
  const y = valid ? Number(month.slice(0, 4)) : now.getFullYear();
  const m = valid ? Number(month.slice(5, 7)) : now.getMonth() + 1;
  const monthStart = `${y}-${String(m).padStart(2, '0')}-01`;
  const nextY = m === 12 ? y + 1 : y;
  const nextM = m === 12 ? 1 : m + 1;
  const nextStart = `${nextY}-${String(nextM).padStart(2, '0')}-01`;
  const todayStr = now.toISOString().slice(0, 10);

  // Snapshot alumnos (actual)
  const { data: alumnos } = await supabaseAdmin
    .from('alumnos')
    .select('fecha_de_vencimiento')
    .eq('gym_id', gymId)
    .is('deleted_at', null);
  const total = alumnos?.length || 0;
  const activos = alumnos?.filter(
    (a) => a.fecha_de_vencimiento && a.fecha_de_vencimiento >= todayStr
  ).length || 0;
  const vencidos = total - activos;

  // Serie de los últimos 6 meses (incluido el seleccionado) para gráficos
  const N = 6;
  const series = [];
  for (let i = N - 1; i >= 0; i--) {
    const d = new Date(y, (m - 1) - i, 1);
    series.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      facturacion: 0,
      altas: 0,
      pagos: 0,
    });
  }
  const idx = {};
  series.forEach((s, i) => { idx[s.month] = i; });
  const seriesStart = `${series[0].month}-01`;

  // Pagos en la ventana
  const { data: pagosWin } = await supabaseAdmin
    .from('pagos')
    .select('monto_total, fecha_de_pago')
    .eq('gym_id', gymId)
    .is('deleted_at', null)
    .gte('fecha_de_pago', seriesStart)
    .lt('fecha_de_pago', nextStart);
  for (const p of pagosWin || []) {
    const i = idx[String(p.fecha_de_pago).slice(0, 7)];
    if (i != null) { series[i].facturacion += Number(p.monto_total || 0); series[i].pagos += 1; }
  }

  // Altas (fecha_inicio) en la ventana
  const { data: altasWin } = await supabaseAdmin
    .from('alumnos')
    .select('fecha_inicio')
    .eq('gym_id', gymId)
    .is('deleted_at', null)
    .gte('fecha_inicio', seriesStart)
    .lt('fecha_inicio', nextStart);
  for (const a of altasWin || []) {
    const i = idx[String(a.fecha_inicio).slice(0, 7)];
    if (i != null) series[i].altas += 1;
  }

  const sel = series[N - 1]; // mes seleccionado = último de la serie

  return {
    month: `${y}-${String(m).padStart(2, '0')}`,
    alumnos: { total, activos, vencidos, altas_mes: sel.altas },
    facturacion: { total: sel.facturacion, cantidad: sel.pagos },
    series,
  };
};