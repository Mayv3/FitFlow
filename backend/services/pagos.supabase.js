import { supabase } from '../db/supabaseClient.js';

const nowISO = () => new Date().toISOString();


export async function getPagosPaged({
  supaClient,
  page = 1,
  limit = 20,
  q = '',
  includeDeleted = false,
  filters = {}
}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supaClient
    .from('pagos')
    .select(`
      id,
      gym_id,
      alumno_id,
      fecha_de_pago,
      fecha_de_venc,
      responsable,
      hora,
      tipo,
      plan_id,
      deleted_at,
      monto_total,
      alumno:alumnos ( nombre, dni ),
      plan:planes_precios ( nombre ),
      items:pago_items (
        monto,
        referencia,
        metodo_de_pago_id,
        metodo:metodos_de_pago ( nombre )
      )
    `, { count: 'exact' })
    .order('fecha_de_pago', { ascending: false })
    .order('hora', { ascending: false });

  if (!includeDeleted) query = query.is('deleted_at', null);
  if (filters.fromDate) query = query.gte('fecha_de_pago', filters.fromDate);
  if (filters.toDate) query = query.lte('fecha_de_pago', filters.toDate);

  if (q && q.trim()) {
    const s = q.trim().replace(/[(),]/g, ' ').replace(/\s+/g, ' ');

    const [{ data: mpRows }, { data: alRows }] = await Promise.all([
      supaClient.from('metodos_de_pago').select('id').ilike('nombre', `%${s}%`),
      supaClient.from('alumnos').select('id').ilike('nombre', `%${s}%`),
    ]);

    const mpIds = (mpRows ?? []).map(r => r.id);
    const alumnoIds = (alRows ?? []).map(r => r.id);

    let pagoIdsByMetodo = [];
    if (mpIds.length) {
      const { data: piRows } = await supaClient
        .from('pago_items')
        .select('pago_id')
        .in('metodo_de_pago_id', mpIds);
      pagoIdsByMetodo = Array.from(new Set((piRows ?? []).map(r => r.pago_id)));
    }

    const ors = [`responsable.ilike.%${s}%`];
    if (alumnoIds.length) ors.push(`alumno_id.in.(${alumnoIds.join(',')})`);
    if (pagoIdsByMetodo.length) ors.push(`id.in.(${pagoIdsByMetodo.join(',')})`);

    query = query.or(ors.join(','));
  }

  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  const items = (data ?? []).map(p => {
    const metodos = (p?.items ?? []).map(i => i?.metodo?.nombre).filter(Boolean);

    let metodo_legible = '—';
    if (metodos.length === 1) {
      metodo_legible = metodos[0];
    } else if (metodos.length > 1) {
      metodo_legible = 'Mixto';
    }

    return {
      ...p,
      alumno_nombre: p?.alumno?.nombre ?? null,
      plan_nombre: p?.plan?.nombre ?? null,
      metodo_legible,
      metodos_legibles: (p?.items ?? []).map(
        i => `${i?.metodo?.nombre ?? '—'} $${i?.monto ?? 0}`
      )
    };
  });

  return { items, total: count ?? 0, page, limit, q };
}

export async function getPagoById(supaClient, id) {
  const { data, error } = await supaClient
    .from('pagos')
    .select(`
      id,
      alumno_id,
      fecha_de_pago,
      fecha_de_venc,
      responsable,
      tipo,
      monto_total,
      plan:planes_precios ( id, nombre ),
      alumno:alumnos ( id, nombre, dni ),
      items:pago_items (
        monto,
        referencia,
        metodo:metodos_de_pago ( id, nombre )
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;

  return {
    ...data,
    alumno_nombre: data?.alumno?.nombre ?? null,
    plan_nombre: data?.plan?.nombre ?? null,
    metodos_legibles: (data?.items ?? []).map(
      i => `${i?.metodo?.nombre ?? '—'} $${i?.monto ?? 0}`
    )
  };
}

export async function createPago(supaClient, pago) {
  const suma = (pago.items ?? []).reduce((acc, it) => acc + Number(it.monto || 0), 0);
  if (Number(pago.monto_total || 0) !== suma) {
    throw new Error('La suma de los ítems no coincide con monto_total');
  }

  const { data: cab, error: e1 } = await supaClient
    .from('pagos')
    .insert({
      alumno_id: pago.alumno_id,
      plan_id: pago.plan_id,
      tipo: pago.tipo,
      hora: pago.hora,
      fecha_de_pago: pago.fecha_de_pago,
      fecha_de_venc: pago.fecha_de_venc,
      responsable: pago.responsable,
      monto_total: pago.monto_total,
    })
    .select('id, alumno_id, plan_id, fecha_de_venc')
    .single();

  if (e1) throw e1;

  if ((pago.items ?? []).length) {
    const rows = pago.items.map(it => ({
      pago_id: cab.id,
      metodo_de_pago_id: it.metodo_de_pago_id,
      monto: it.monto,
      referencia: it.referencia ?? null,
    }));

    const { error: e2 } = await supaClient.from('pago_items').insert(rows);
    if (e2) throw e2;
  }

  if (pago.plan_id) {
    const { data: planRow } = await supaClient
      .from('planes_precios')
      .select('numero_clases, nombre')
      .eq('id', pago.plan_id)
      .single();

    const clasesPagadas = planRow?.numero_clases ?? 0;

    const { error: eUpd } = await supaClient
      .from('alumnos')
      .update({
        plan_id: pago.plan_id,
        fecha_de_vencimiento: pago.fecha_de_venc,
        clases_realizadas: 0,
        clases_pagadas: clasesPagadas,
      })
      .eq('id', pago.alumno_id);

    if (eUpd) throw eUpd;
  }

  // 4. Devolver pago con joins (igual que en GET)
  return await getPagoById(supaClient, cab.id);
}

export async function updatePago(supaClient, id, nuevosDatos, { includeDeleted = false } = {}) {
  const { items, ...cabecera } = nuevosDatos;

  // 1. Traer el pago actual (para conservar monto_total si no se manda nada)
  const { data: pagoPrev, error: ePrev } = await supaClient
    .from('pagos')
    .select('monto_total')
    .eq('id', id)
    .single();

  if (ePrev) throw ePrev;

  let monto_total = cabecera.monto_total ?? pagoPrev.monto_total;

  // 2. Si vienen items recalculamos
  if (Array.isArray(items)) {
    monto_total = items.reduce((acc, it) => acc + Number(it.monto || 0), 0);
  }

  // 3. Update cabecera (con RLS, el usuario solo puede editar pagos de su gym)
  let q = supaClient
    .from('pagos')
    .update({ ...cabecera, monto_total })
    .eq('id', id)
    .select('id, alumno_id, plan_id, fecha_de_venc')
    .single();

  if (!includeDeleted) q = q.is('deleted_at', null);

  const { data: pagoCab, error } = await q;
  if (error) throw error;

  // 4. Si mandaron items → reemplazamos
  if (Array.isArray(items)) {
    await supaClient.from('pago_items').delete().eq('pago_id', id);

    if (items.length) {
      const rows = items.map(it => ({
        pago_id: id,
        metodo_de_pago_id: it.metodo_de_pago_id,
        monto: it.monto,
        referencia: it.referencia ?? null,
      }));

      const { error: eItems } = await supaClient.from('pago_items').insert(rows);
      if (eItems) throw eItems;
    }
  }

  // 5. Devolver pago completo (con joins)
  return await getPagoById(supaClient, id);
}

/** Soft delete */

export async function deletePago(supaClient, id) {
  const { data, error } = await supaClient
    .from('pagos')
    .update({ deleted_at: new Date().toISOString() })
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
