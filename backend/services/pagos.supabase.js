import { supabase, supabaseAdmin } from '../config/supabaseClient.js';

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

  const s = (q ?? '').trim().replace(/\s+/g, ' ');

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
    `, s ? {} : { count: 'exact' })
    .order('fecha_de_pago', { ascending: false })
    .order('hora', { ascending: false })
    .order('id', { ascending: false });

  let data, count;
  if (s) {
    // Búsqueda: la DB filtra (responsable, nombre del alumno o método de pago)
    // y devuelve solo los ids de esta página + el total. Antes se armaba un
    // `id.in.(...)` con todos los pagos del método buscado ("efectivo" = miles
    // de ids en la URL) y la request fallaba. Corre con el JWT del usuario: RLS.
    const { data: res, error: eBusq } = await supaClient.rpc('buscar_pagos', {
      p_q: s,
      p_desde: filters.fromDate || null,
      p_hasta: filters.toDate || null,
      p_incluir_eliminados: includeDeleted,
      p_limit: limit,
      p_offset: from,
    });
    if (eBusq) throw eBusq;

    count = res?.total ?? 0;
    const ids = res?.ids ?? [];
    if (ids.length) {
      const { data: rows, error } = await query.in('id', ids);
      if (error) throw error;
      data = rows;
    } else {
      data = [];
    }
  } else {
    if (!includeDeleted) query = query.is('deleted_at', null);
    if (filters.fromDate) query = query.gte('fecha_de_pago', filters.fromDate);
    if (filters.toDate) query = query.lte('fecha_de_pago', filters.toDate);

    const res = await query.range(from, to);
    if (res.error) throw res.error;
    data = res.data;
    count = res.count;
  }

  // Detectar alumnos eliminados (alumno_id existe pero el join no devuelve nada)
  const deletedAlumnoIds = [
    ...new Set(
      (data ?? [])
        .filter(p => p.alumno_id && !p.alumno?.nombre)
        .map(p => p.alumno_id)
    ),
  ];

  let deletedAlumnosMap = {};
  if (deletedAlumnoIds.length > 0) {
    const { data: deletedRows } = await supabaseAdmin
      .from('alumnos')
      .select('id, nombre, dni')
      .in('id', deletedAlumnoIds);
    deletedAlumnosMap = Object.fromEntries(
      (deletedRows ?? []).map(a => [a.id, a])
    );
  }

  const items = (data ?? []).map(p => {
    const metodos = (p?.items ?? []).map(i => i?.metodo?.nombre).filter(Boolean);

    let metodo_legible = '—';
    if (metodos.length === 1) {
      metodo_legible = metodos[0];
    } else if (metodos.length > 1) {
      metodo_legible = 'Mixto';
    }

    const alumnoEliminado = !!(p.alumno_id && !p.alumno?.nombre && deletedAlumnosMap[p.alumno_id]);

    return {
      ...p,
      alumno_nombre: p?.alumno?.nombre ?? deletedAlumnosMap[p?.alumno_id]?.nombre ?? null,
      alumno_eliminado: alumnoEliminado,
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
  // Chequeo rápido en el cliente para fallar sin ir a la DB; el RPC repite
  // esta misma validación como defensa en profundidad.
  const suma = (pago.items ?? []).reduce((acc, it) => acc + Number(it.monto || 0), 0);
  if (Number(pago.monto_total || 0) !== suma) {
    throw new Error('La suma de los ítems no coincide con monto_total');
  }

  // create_pago hace TODO (insert pago + items + snapshot + update alumno +
  // descuento de stock) en una sola transacción atómica en la DB: si algo
  // falla a mitad de camino, Postgres deshace todo solo. Reemplaza la
  // secuencia de llamadas sueltas que dejaba pagos "huérfanos" sin
  // actualizar al alumno cuando un paso intermedio fallaba.
  const { data: pagoId, error } = await supaClient.rpc('create_pago', {
    p_alumno_id: pago.alumno_id,
    p_plan_id: pago.plan_id ?? null,
    p_tipo: pago.tipo,
    p_service_id: pago.service_id ?? null,
    p_producto_id: pago.producto_id ?? null,
    p_hora: pago.hora,
    p_fecha_de_pago: pago.fecha_de_pago,
    p_fecha_de_venc: pago.fecha_de_venc,
    p_responsable: pago.responsable,
    p_monto_total: pago.monto_total,
    p_cantidad_producto: Number(pago.cantidad_producto) || 1,
    p_items: pago.items ?? [],
  });

  if (error) throw error;

  const { data: cab, error: e1 } = await supaClient
    .from('pagos')
    .select(`
      id, alumno_id, plan_id, service_id, producto_id, fecha_de_venc,
      fecha_de_pago, responsable, tipo, monto_total,
      plan:planes_precios ( id, nombre ),
      servicio:servicios!service_id ( id, nombre ),
      alumno:alumnos ( id, nombre, dni )
    `)
    .eq('id', pagoId)
    .single();
  if (e1) throw e1;

  const { data: insertedItems, error: e2 } = await supaClient
    .from('pago_items')
    .select('monto, referencia, metodo:metodos_de_pago(id, nombre)')
    .eq('pago_id', pagoId);
  if (e2) throw e2;

  return {
    ...cab,
    alumno_nombre: cab?.alumno?.nombre ?? null,
    plan_nombre: cab?.plan?.nombre ?? null,
    servicio_nombre: cab?.servicio?.nombre ?? null,
    items: insertedItems ?? [],
    metodos_legibles: (insertedItems ?? []).map(i => `${i?.metodo?.nombre ?? '—'} $${i?.monto ?? 0}`),
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

/**
 * Soft delete + restaura estado del alumno / stock, todo en una transacción
 * atómica (RPC delete_pago). Reemplaza el recálculo/restauración manual en
 * JS por la misma lógica corriendo del lado de la DB.
 */
export async function deletePago(supaClient, id) {
  const { data, error } = await supaClient.rpc('delete_pago', { p_id: id });

  if (error) {
    if (error.code === 'P0002') {
      const err = new Error('Pago no encontrado');
      err.code = 'NOT_FOUND';
      throw err;
    }
    throw error;
  }

  return data;
}

export async function restorePago(supaClient, id) {
  const { data, error } = await supaClient.rpc('restore_pago', { p_id: id });

  if (error) {
    if (error.code === 'P0002') {
      const err = new Error('Pago no encontrado o no estaba eliminado');
      err.code = 'NOT_FOUND';
      throw err;
    }
    throw error;
  }

  return data;
}

export async function hardDeletePago(supaClient, id) {
  const { data, error } = await supaClient.from('pagos').delete().eq('id', id).single();
  if (error) throw error;
  return data;
}
