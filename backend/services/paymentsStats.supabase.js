import { supabaseAdmin } from '../db/supabaseClient.js';
import moment from 'moment-timezone';

async function getAllPayments(gymId) {
    let q = supabaseAdmin
        .from('pago_items')
        .select(`
        monto,
        pago:pagos!inner(id, gym_id)
      `);

    if (gymId) q = q.eq('pago.gym_id', gymId);

    const { data, error } = await q;
    if (error) throw error;

    // agrupar por pago_id
    const grouped = {};
    (data ?? []).forEach(row => {
        const pid = row.pago.id;
        if (!grouped[pid]) grouped[pid] = { id: pid, monto: 0 };
        grouped[pid].monto += Number(row.monto ?? 0);
    });

    return Object.values(grouped);
}

async function getPaymentsInRange(gymId, fromDate, toDate) {
    let q = supabaseAdmin
        .from('pago_items')
        .select(`
        monto,
        pago:pagos!inner(id, gym_id, fecha_de_pago, deleted_at)
      `)
        .is('pago.deleted_at', null);

    if (gymId) q = q.eq('pago.gym_id', gymId);
    if (fromDate) q = q.gte('pago.fecha_de_pago', fromDate);
    if (toDate) q = q.lte('pago.fecha_de_pago', toDate);

    const { data, error } = await q;
    if (error) throw error;

    // agrupar por pago_id
    const grouped = {};
    (data ?? []).forEach(row => {
        const pid = row.pago.id;
        if (!grouped[pid]) grouped[pid] = { id: pid, monto: 0 };
        grouped[pid].monto += Number(row.monto ?? 0);
    });

    return Object.values(grouped);
}

async function getPaymentsByMethod(gymId, fromDate, toDate) {
    let q = supabaseAdmin
        .from('pagos')
        .select(`
        id,
        fecha_de_pago,
        deleted_at,
        monto_total,
        items:pago_items (
          monto,
          metodo_de_pago_id,
          metodo:metodos_de_pago(nombre)
        )
      `)
        .is('deleted_at', null);

    if (gymId) q = q.eq('gym_id', gymId);
    if (fromDate) q = q.gte('fecha_de_pago', fromDate);
    if (toDate) q = q.lte('fecha_de_pago', toDate);

    const { data, error } = await q;
    if (error) throw error;

    const grouped = {};
    (data ?? []).forEach(pago => {
        const metodos = (pago.items ?? []).map(i => i.metodo?.nombre).filter(Boolean);

        let key = '—';
        if (metodos.length === 1) {
            key = metodos[0];
        } else if (metodos.length > 1) {
            key = 'Mixto';
        }

        if (!grouped[key]) grouped[key] = { metodo: key, count: 0, monto: 0 };
        grouped[key].count += 1;
        grouped[key].monto += Number(pago.monto_total || 0);
    });

    return Object.values(grouped);
}

async function getPaymentsByTipo(gymId, fromDate, toDate) {
    let q = supabaseAdmin
        .from('pagos')
        .select(`
        id,
        tipo,
        gym_id,
        fecha_de_pago,
        deleted_at,
        monto_total
      `)
        .is('deleted_at', null);

    if (gymId) q = q.eq('gym_id', gymId);
    if (fromDate) q = q.gte('fecha_de_pago', fromDate);
    if (toDate) q = q.lte('fecha_de_pago', toDate);

    const { data, error } = await q;
    if (error) throw error;

    const grouped = {};
    (data ?? []).forEach(row => {
        const key = row.tipo || 'Otro';
        if (!grouped[key]) grouped[key] = { tipo: key, count: 0, monto: 0 };
        grouped[key].count += 1;
        grouped[key].monto += Number(row.monto_total || 0);
    });

    return Object.values(grouped);
}

export async function getPaymentsStatsService({ gymId, fromDate, toDate } = {}) {
    const today = moment().tz('America/Argentina/Buenos_Aires').format('YYYY-MM-DD')

    const appliedFrom = fromDate || today
    const appliedTo = toDate || today

    const [allPayments, paymentsInRange, byMethod, byTipo] = await Promise.all([
        getAllPayments(gymId),
        getPaymentsInRange(gymId, appliedFrom, appliedTo),
        getPaymentsByMethod(gymId, appliedFrom, appliedTo),
        getPaymentsByTipo(gymId, appliedFrom, appliedTo),
    ])

    const totalPagos = allPayments.length
    const totalMonto = allPayments.reduce((acc, p) => acc + (p.monto ?? 0), 0)

    const pagosFiltrados = paymentsInRange.length
    const montoFiltrado = paymentsInRange.reduce((acc, p) => acc + (p.monto ?? 0), 0)

    return {
        totalPagos,
        totalMonto,
        pagosFiltrados,
        montoFiltrado,
        byMethod,
        byTipo,
        range: { fromDate: appliedFrom, toDate: appliedTo }
    }
}

