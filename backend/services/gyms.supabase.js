import { supabaseAdmin } from '../db/supabaseClient.js'

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