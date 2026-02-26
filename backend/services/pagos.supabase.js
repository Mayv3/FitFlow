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
      service_id,
      tipo,
      plan_id,
      producto_id,
      deleted_at,
      monto_total,
      alumno:alumnos ( nombre, dni ),
      plan:planes_precios ( nombre ),
      servicio:servicios!service_id ( nombre ),
      producto:productos ( nombre ),
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
      servicio_nombre: p?.servicio?.nombre ?? null,
      producto_nombre: p?.producto?.nombre ?? null,
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
      servicio:servicios!service_id ( id, nombre ),
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
    servicio_nombre: data?.servicio?.nombre ?? null,
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
      service_id: pago.service_id ?? null,
      producto_id: pago.producto_id ?? null,
      hora: pago.hora,
      fecha_de_pago: pago.fecha_de_pago,
      fecha_de_venc: pago.fecha_de_venc,
      responsable: pago.responsable,
      monto_total: pago.monto_total,
    })
    .select(`
      id, alumno_id, plan_id, service_id, producto_id, fecha_de_venc,
      fecha_de_pago, responsable, tipo, monto_total,
      plan:planes_precios ( id, nombre ),
      servicio:servicios!service_id ( id, nombre ),
      alumno:alumnos ( id, nombre, dni )
    `)
    .single();

  if (e1) throw e1;

  let insertedItems = [];
  if ((pago.items ?? []).length) {
    const rows = pago.items.map(it => ({
      pago_id: cab.id,
      metodo_de_pago_id: it.metodo_de_pago_id,
      monto: it.monto,
      referencia: it.referencia ?? null,
    }));

    const { data: itemsData, error: e2 } = await supaClient
      .from('pago_items')
      .insert(rows)
      .select('monto, referencia, metodo:metodos_de_pago(id, nombre)');
    if (e2) throw e2;
    insertedItems = itemsData ?? [];
  }

  if (pago.isPlan && pago.plan_id) {
    const { data: planRow, error: planError } = await supaClient
      .from('planes_precios')
      .select('numero_clases, nombre')
      .eq('id', pago.plan_id)
      .single();

    if (planError) throw planError;

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

  // Si es un pago de producto, descontar 1 del stock
  if (pago.producto_id) {
    const { data: producto, error: productoError } = await supaClient
      .from('productos')
      .select('stock')
      .eq('id', pago.producto_id)
      .single();

    if (productoError) throw productoError;

    if (producto.stock <= 0) {
      throw new Error('Producto sin stock disponible');
    }

    const { error: stockError } = await supaClient
      .from('productos')
      .update({ stock: producto.stock - 1 })
      .eq('id', pago.producto_id);

    if (stockError) throw stockError;
  }


  return {
    ...cab,
    alumno_nombre: cab?.alumno?.nombre ?? null,
    plan_nombre: cab?.plan?.nombre ?? null,
    servicio_nombre: cab?.servicio?.nombre ?? null,
    items: insertedItems,
    metodos_legibles: insertedItems.map(i => `${i?.metodo?.nombre ?? '—'} $${i?.monto ?? 0}`),
  };
}

export async function updatePago(supaClient, id, nuevosDatos, { includeDeleted = false } = {}) {
  const { items, ...cabecera } = nuevosDatos;

  const { data: pagoPrev, error: ePrev } = await supaClient
    .from('pagos')
    .select('monto_total')
    .eq('id', id)
    .single();

  if (ePrev) throw ePrev;

  let monto_total = cabecera.monto_total ?? pagoPrev.monto_total;

  if (Array.isArray(items)) {
    monto_total = items.reduce((acc, it) => acc + Number(it.monto || 0), 0);
  }

  let q = supaClient
    .from('pagos')
    .update({ ...cabecera, monto_total, service_id: cabecera.service_id ?? null })
    .eq('id', id)
    .select(`
      id, alumno_id, plan_id, service_id, fecha_de_venc,
      fecha_de_pago, responsable, tipo, monto_total,
      plan:planes_precios ( id, nombre ),
      servicio:servicios!service_id ( id, nombre ),
      alumno:alumnos ( id, nombre, dni )
    `)
    .single();

  if (!includeDeleted) q = q.is('deleted_at', null);

  const { data: pagoCab, error } = await q;
  if (error) throw error;

  let pagoItems = [];
  if (Array.isArray(items)) {
    await supaClient.from('pago_items').delete().eq('pago_id', id);

    if (items.length) {
      const rows = items.map(it => ({
        pago_id: id,
        metodo_de_pago_id: it.metodo_de_pago_id,
        monto: it.monto,
        referencia: it.referencia ?? null,
      }));

      const { data: itemsData, error: eItems } = await supaClient
        .from('pago_items')
        .insert(rows)
        .select('monto, referencia, metodo:metodos_de_pago(id, nombre)');
      if (eItems) throw eItems;
      pagoItems = itemsData ?? [];
    }
  } else {
    const { data: existingItems } = await supaClient
      .from('pago_items')
      .select('monto, referencia, metodo:metodos_de_pago(id, nombre)')
      .eq('pago_id', id);
    pagoItems = existingItems ?? [];
  }

  return {
    ...pagoCab,
    alumno_nombre: pagoCab?.alumno?.nombre ?? null,
    plan_nombre: pagoCab?.plan?.nombre ?? null,
    servicio_nombre: pagoCab?.servicio?.nombre ?? null,
    items: pagoItems,
    metodos_legibles: pagoItems.map(i => `${i?.metodo?.nombre ?? '—'} $${i?.monto ?? 0}`),
  };
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
