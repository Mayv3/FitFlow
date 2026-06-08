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

    // Snapshot del estado del alumno ANTES de pisarlo, para poder
    // restaurarlo exacto si este pago se elimina.
    const { data: alumnoPrev } = await supaClient
      .from('alumnos')
      .select('plan_id, fecha_de_vencimiento, clases_pagadas, clases_realizadas, gym_id')
      .eq('id', pago.alumno_id)
      .single();

    if (alumnoPrev) {
      await supabaseAdmin.from('alumno_snapshots').insert({
        pago_id: cab.id,
        alumno_id: pago.alumno_id,
        gym_id: alumnoPrev.gym_id ?? pago.gym_id ?? null,
        plan_id: alumnoPrev.plan_id,
        fecha_de_vencimiento: alumnoPrev.fecha_de_vencimiento,
        clases_pagadas: alumnoPrev.clases_pagadas,
        clases_realizadas: alumnoPrev.clases_realizadas,
        accion: 'create',
      });
    }

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

  // Si es un pago de producto, descontar del stock
  if (pago.producto_id) {
    const cantidad = Number(pago.cantidad_producto) || 1;

    const { data: producto, error: productoError } = await supaClient
      .from('productos')
      .select('stock')
      .eq('id', pago.producto_id)
      .single();

    if (productoError) throw productoError;

    if (producto.stock <= 0) {
      throw new Error('Producto sin stock disponible');
    }
    if (producto.stock < cantidad) {
      throw new Error(`Stock insuficiente. Disponible: ${producto.stock}`);
    }

    const { error: stockError } = await supaClient
      .from('productos')
      .update({ stock: producto.stock - cantidad })
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

/**
 * Recalcula el estado del alumno (plan, vencimiento, clases) a partir del
 * último pago de plan que sigue vivo. Si no queda ninguno, resetea.
 * Un pago es "de plan" cuando tiene plan_id (no se guarda isPlan en DB).
 */
async function recalcAlumnoTrasPlan(supaClient, alumnoId) {
  const { data: ultimoPago, error: eUlt } = await supaClient
    .from('pagos')
    .select('plan_id, fecha_de_venc, fecha_de_pago')
    .eq('alumno_id', alumnoId)
    .not('plan_id', 'is', null)
    .is('deleted_at', null)
    .order('fecha_de_pago', { ascending: false })
    .order('hora', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (eUlt) throw eUlt;

  // No queda ningún pago de plan vivo => resetear alumno
  if (!ultimoPago) {
    const { data: reseteado, error: eReset } = await supaClient
      .from('alumnos')
      .update({
        plan_id: null,
        fecha_de_vencimiento: null,
        clases_pagadas: 0,
        clases_realizadas: 0,
      })
      .eq('id', alumnoId)
      .select('id, nombre, plan_id, fecha_de_vencimiento, clases_pagadas, clases_realizadas')
      .single();
    if (eReset) throw eReset;
    return { alumno: reseteado, origen: 'reset', pago_vigente: null };
  }

  // Clases del plan vigente
  const { data: planRow, error: ePlan } = await supaClient
    .from('planes_precios')
    .select('numero_clases')
    .eq('id', ultimoPago.plan_id)
    .single();
  if (ePlan) throw ePlan;
  const clasesPagadas = planRow?.numero_clases ?? 0;

  // clases_realizadas = asistencias desde la fecha del pago vigente
  const { count: realizadas, error: eCount } = await supaClient
    .from('asistencias')
    .select('id', { count: 'exact', head: true })
    .eq('alumno_id', alumnoId)
    .gte('fecha', ultimoPago.fecha_de_pago);
  if (eCount) throw eCount;

  const { data: actualizado, error: eUpd } = await supaClient
    .from('alumnos')
    .update({
      plan_id: ultimoPago.plan_id,
      fecha_de_vencimiento: ultimoPago.fecha_de_venc,
      clases_pagadas: clasesPagadas,
      clases_realizadas: realizadas ?? 0,
    })
    .eq('id', alumnoId)
    .select('id, nombre, plan_id, fecha_de_vencimiento, clases_pagadas, clases_realizadas')
    .single();
  if (eUpd) throw eUpd;

  return { alumno: actualizado, origen: 'pago_anterior', pago_vigente: ultimoPago };
}

/**
 * Restaura al alumno EXACTO al estado guardado en el snapshot tomado al crear
 * el pago. Devuelve null si no hay snapshot (=> usar fallback recalculo).
 */
async function restaurarDesdeSnapshot(supaClient, alumnoId, pagoId) {
  const { data: snap, error: eSnap } = await supabaseAdmin
    .from('alumno_snapshots')
    .select('plan_id, fecha_de_vencimiento, clases_pagadas, clases_realizadas')
    .eq('pago_id', pagoId)
    .eq('alumno_id', alumnoId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (eSnap) throw eSnap;
  if (!snap) return null;

  const { data: actualizado, error: eUpd } = await supaClient
    .from('alumnos')
    .update({
      plan_id: snap.plan_id,
      fecha_de_vencimiento: snap.fecha_de_vencimiento,
      clases_pagadas: snap.clases_pagadas,
      clases_realizadas: snap.clases_realizadas,
    })
    .eq('id', alumnoId)
    .select('id, nombre, plan_id, fecha_de_vencimiento, clases_pagadas, clases_realizadas')
    .single();
  if (eUpd) throw eUpd;

  return { alumno: actualizado, origen: 'snapshot', snapshot: snap };
}

/** Soft delete + restaura estado del alumno / stock */

export async function deletePago(supaClient, id) {
  // Leer el pago SIN filtrar deleted_at: queremos poder re-restaurar el alumno
  // aunque el pago ya estuviera borrado de antes (incidentes previos al fix).
  const { data: pago, error: eGet } = await supaClient
    .from('pagos')
    .select('id, alumno_id, plan_id, producto_id, fecha_de_pago, fecha_de_venc, monto_total, tipo, deleted_at')
    .eq('id', id)
    .maybeSingle();

  if (eGet) throw eGet;
  if (!pago) {
    const err = new Error('Pago no encontrado');
    err.code = 'NOT_FOUND';
    throw err;
  }

  // Estado del alumno ANTES de restaurar
  let alumnoAntes = null;
  if (pago.alumno_id) {
    const { data: aAntes } = await supaClient
      .from('alumnos')
      .select('id, nombre, plan_id, fecha_de_vencimiento, clases_pagadas, clases_realizadas')
      .eq('id', pago.alumno_id)
      .single();
    alumnoAntes = aAntes ?? null;
  }

  // Soft-delete sólo si seguía vivo. `data` !== null => transición real live->deleted.
  const { data, error } = await supaClient
    .from('pagos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();

  if (error) throw error;

  const yaEstabaEliminado = !data;

  // Restaurar estado del alumno si era pago de plan.
  // 1º intentar snapshot exacto (estado previo a este pago).
  // 2º si no hay snapshot (pagos viejos) => recalcular desde pagos vivos.
  let restauracion = null;
  if (pago.plan_id && pago.alumno_id) {
    restauracion = await restaurarDesdeSnapshot(supaClient, pago.alumno_id, pago.id);
    if (!restauracion) {
      restauracion = await recalcAlumnoTrasPlan(supaClient, pago.alumno_id);
    }
  }

  // Devolver stock si era venta de producto Y recién ahora lo borramos.
  // (Si ya estaba borrado, el stock ya se devolvió antes => no duplicar.)
  // La cantidad no se persiste en pagos => best-effort: 1 unidad.
  let stockInfo = null;
  if (pago.producto_id && !yaEstabaEliminado) {
    const cantidad = 1;
    const { data: producto, error: eProd } = await supaClient
      .from('productos')
      .select('stock')
      .eq('id', pago.producto_id)
      .single();
    if (eProd) throw eProd;

    const nuevoStock = (producto?.stock ?? 0) + cantidad;
    const { error: eStock } = await supaClient
      .from('productos')
      .update({ stock: nuevoStock })
      .eq('id', pago.producto_id);
    if (eStock) throw eStock;
    stockInfo = { producto_id: pago.producto_id, stock_antes: producto?.stock ?? 0, stock_despues: nuevoStock, devuelto: cantidad };
  }

  // Resumen del proceso (para debug en frontend)
  return {
    ok: true,
    ya_estaba_eliminado: yaEstabaEliminado,
    pago_eliminado: pago,
    alumno_antes: alumnoAntes,
    alumno_despues: restauracion?.alumno ?? null,
    restauracion_origen: restauracion?.origen ?? null,   // 'snapshot' | 'pago_anterior' | 'reset' | null
    snapshot: restauracion?.snapshot ?? null,            // estado previo guardado al crear el pago
    pago_vigente: restauracion?.pago_vigente ?? null,    // (fallback) pago de plan que quedó vigente
    stock: stockInfo,
  };
}

export async function restorePago(supaClient, id) {
  const { data, error } = await supaClient
    .from('pagos')
    .update({ deleted_at: null })
    .eq('id', id)
    .not('deleted_at', 'is', null)
    .select('id, alumno_id, plan_id, producto_id')
    .single();
  if (error) throw error;

  // Re-aplicar estado del alumno si era pago de plan
  if (data?.plan_id && data?.alumno_id) {
    await recalcAlumnoTrasPlan(supaClient, data.alumno_id);
  }

  // Re-descontar stock si era venta de producto (cantidad no persistida => 1)
  if (data?.producto_id) {
    const cantidad = 1;
    const { data: producto, error: eProd } = await supaClient
      .from('productos')
      .select('stock')
      .eq('id', data.producto_id)
      .single();
    if (eProd) throw eProd;

    const { error: eStock } = await supaClient
      .from('productos')
      .update({ stock: Math.max((producto?.stock ?? 0) - cantidad, 0) })
      .eq('id', data.producto_id);
    if (eStock) throw eStock;
  }

  return data;
}

export async function hardDeletePago(supaClient, id) {
  const { data, error } = await supaClient.from('pagos').delete().eq('id', id).single();
  if (error) throw error;
  return data;
}
