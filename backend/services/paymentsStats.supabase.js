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

async function getPaymentsInRangeCombined(gymId, fromDate, toDate) {
    let q = supabaseAdmin
        .from('pagos')
        .select(`
        id,
        tipo,
        monto_total,
        items:pago_items (
          metodo:metodos_de_pago ( nombre )
        )
      `)
        .is('deleted_at', null);

    if (gymId) q = q.eq('gym_id', gymId);
    if (fromDate) q = q.gte('fecha_de_pago', fromDate);
    if (toDate) q = q.lte('fecha_de_pago', toDate);

    const { data, error } = await q;
    if (error) throw error;

    const paymentsInRange = (data ?? []).map(p => ({ id: p.id, monto: Number(p.monto_total || 0) }));

    const byMethodMap = {};
    const byTipoMap = {};

    (data ?? []).forEach(pago => {
        const metodos = (pago.items ?? []).map(i => i.metodo?.nombre).filter(Boolean);
        const methodKey = metodos.length === 1 ? metodos[0] : metodos.length > 1 ? 'Mixto' : '—';
        if (!byMethodMap[methodKey]) byMethodMap[methodKey] = { metodo: methodKey, count: 0, monto: 0 };
        byMethodMap[methodKey].count += 1;
        byMethodMap[methodKey].monto += Number(pago.monto_total || 0);

        const tipoKey = pago.tipo || 'Otro';
        if (!byTipoMap[tipoKey]) byTipoMap[tipoKey] = { tipo: tipoKey, count: 0, monto: 0 };
        byTipoMap[tipoKey].count += 1;
        byTipoMap[tipoKey].monto += Number(pago.monto_total || 0);
    });

    return {
        paymentsInRange,
        byMethod: Object.values(byMethodMap),
        byTipo: Object.values(byTipoMap),
    };
}

export async function getPaymentsStatsService({ gymId, fromDate, toDate } = {}) {
    const today = moment().tz('America/Argentina/Buenos_Aires').format('YYYY-MM-DD')

    const appliedFrom = fromDate || today
    const appliedTo = toDate || today

    const [allPayments, rangeResult] = await Promise.all([
        getAllPayments(gymId),
        getPaymentsInRangeCombined(gymId, appliedFrom, appliedTo),
    ])

    const totalPagos = allPayments.length
    const totalMonto = allPayments.reduce((acc, p) => acc + (p.monto ?? 0), 0)

    const pagosFiltrados = rangeResult.paymentsInRange.length
    const montoFiltrado = rangeResult.paymentsInRange.reduce((acc, p) => acc + (p.monto ?? 0), 0)

    return {
        totalPagos,
        totalMonto,
        pagosFiltrados,
        montoFiltrado,
        byMethod: rangeResult.byMethod,
        byTipo: rangeResult.byTipo,
        range: { fromDate: appliedFrom, toDate: appliedTo }
    }
}

