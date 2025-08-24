import { supabase } from '../db/supabaseClient.js';

const nowISO = () => new Date().toISOString();

export async function getPagosPaged({
  gymId,
  page = 1,
  limit = 20,
  q = '',
  includeDeleted = false,
  filters = {}
}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('pagos')
    .select(
      `
      id,
      gym_id,
      alumno_id,
      monto,
      metodo_de_pago_id,
      fecha_de_pago,
      fecha_de_venc,
      responsable,
      hora,
      tipo,
      plan_id,
      deleted_at,
      metodos_de_pago:metodos_de_pago ( nombre ),
      alumno:alumnos ( nombre, dni ),
      planes_precios ( nombre )
      `,
      { count: 'exact' }
    )
    .order('fecha_de_pago', { ascending: false })
    .order('hora', { ascending: false })

  if (gymId) query = query.eq('gym_id', gymId);
  if (!includeDeleted) query = query.is('deleted_at', null);

  if (filters.fromDate) query = query.gte('fecha_de_pago', filters.fromDate);
  if (filters.toDate) query = query.lte('fecha_de_pago', filters.toDate);

  if (q && q.trim()) {
    const s = q.trim().replace(/[(),]/g, ' ').replace(/\s+/g, ' ');

    const [{ data: mpRows }, { data: alRows }] = await Promise.all([
      supabase.from('metodos_de_pago').select('id').ilike('nombre', `%${s}%`),
      supabase.from('alumnos').select('id').ilike('nombre', `%${s}%`),
    ]);

    const mpIds = (mpRows ?? []).map(r => r.id);
    const alumnoIds = (alRows ?? []).map(r => r.id);

    const ors = [`responsable.ilike.%${s}%`];
    if (mpIds.length) ors.push(`metodo_de_pago_id.in.(${mpIds.join(',')})`);
    if (alumnoIds.length) ors.push(`alumno_id.in.(${alumnoIds.join(',')})`);

    query = query.or(ors.join(','));
  }

  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  const items = (data ?? []).map((p) => ({
    ...p,
    metodo_nombre: p?.metodos_de_pago?.nombre ?? null,
    alumno_nombre: p?.alumno?.nombre ?? null,
    plan_nombre: p?.planes_precios?.nombre ?? null,
  }));

  return {
    items,
    total: count ?? 0,
    page,
    limit,
    q,
  };
}

export async function getPagoById(id, { includeDeleted = false } = {}) {
  let q = supabase.from('pagos').select('*').eq('id', id);
  if (!includeDeleted) q = q.is('deleted_at', null);
  const { data, error } = await q.single();
  if (error) throw error;
  return data;
}

export async function createPago(pago) {
  const { data, error } = await supabase
    .from('pagos')
    .insert(pago)
    .select(`
      id,
      monto,
      metodo_de_pago_id,
      alumno_id,
      plan_id,
      tipo,
      hora,
      fecha_de_pago,
      fecha_de_venc,
      responsable,
      alumnos ( nombre ),
      plan:planes_precios ( nombre, numero_clases ),
      metodo:metodos_de_pago ( nombre )
    `)
    .single();

  if (error) throw error;

  const clasesPagadas = data.plan?.numero_clases ?? 0;


  const { error: eUpd } = await supabase
    .from('alumnos')
    .update({
      plan_id: pago.plan_id,
      fecha_de_vencimiento: pago.fecha_de_venc,
      clases_realizadas: 0,
      clases_pagadas: clasesPagadas
    })
    .eq('id', pago.alumno_id);

  return {
    ...data,
    alumno_nombre: data.alumnos?.nombre ?? null,
    plan_nombre: data.plan?.nombre ?? null,
    metodo_nombre: data.metodo?.nombre ?? null,
    clases_pagadas: clasesPagadas
  };
}

export async function updatePago(id, nuevosDatos, { includeDeleted = false } = {}) {
  let q = supabase
    .from('pagos')
    .update(nuevosDatos)
    .eq('id', id)
    .select(`
      id,
      gym_id,
      alumno_id,
      monto,
      metodo_de_pago_id,
      fecha_de_pago,
      fecha_de_venc,
      responsable,
      hora,
      tipo,
      plan_id,
      alumnos ( nombre, dni ),
      metodos_de_pago ( nombre ),
      plan:planes_precios ( nombre )
    `)
    .single();

  if (!includeDeleted) q = q.is('deleted_at', null);

  const { data, error } = await q;
  if (error) throw error;

  if (nuevosDatos.plan_id || nuevosDatos.fecha_de_venc) {
    const { error: eUpd } = await supabase
      .from('alumnos')
      .update({
        ...(nuevosDatos.plan_id && { plan_id: nuevosDatos.plan_id }),
        ...(nuevosDatos.fecha_de_venc && { fecha_de_vencimiento: nuevosDatos.fecha_de_venc }),
      })
      .eq('id', data.alumno_id);

    if (eUpd) throw eUpd;
  }

  return {
    ...data,
    alumno_nombre: data.alumnos?.nombre ?? null,
    metodo_nombre: data.metodos_de_pago?.nombre ?? null,
    plan_nombre: data.plan?.nombre ?? null,
  };
}


/** Soft delete */

export async function deletePago(id) {
  const { data, error } = await supabase
    .from('pagos')
    .update({ deleted_at: nowISO() })
    .eq('id', id)
    .is('deleted_at', null)
    .single();
  if (error) throw error;
  return data;
}

export async function restorePago(id) {
  const { data, error } = await supabase
    .from('pagos')
    .update({ deleted_at: null })
    .eq('id', id)
    .not('deleted_at', 'is', null)
    .single();
  if (error) throw error;
  return data;
}

export async function hardDeletePago(id) {
  const { data, error } = await supabase.from('pagos').delete().eq('id', id).single();
  if (error) throw error;
  return data;
}
