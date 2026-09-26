import { supabaseAdmin } from '../config/supabaseClient.js';
import moment from 'moment-timezone';
import { fetchAllPaged } from '../utilities/fetchAllPaged.js';

async function getPaymentsInRangeCombined(gymId, fromDate, toDate) {
    const data = await fetchAllPaged(() => {
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
        return q.order('id');
    });

    const paymentsInRange = data.map(p => ({ id: p.id, monto: Number(p.monto_total || 0) }));

    const byMethodMap = {};
    const byTipoMap = {};

    data.forEach(pago => {
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

// Antes también devolvía totalPagos/totalMonto históricos, que bajaban TODOS
// los pago_items del gym en cada visita a Pagos. El frontend nunca los usaba.
export async function getPaymentsStatsService({ gymId, fromDate, toDate } = {}) {
    const today = moment().tz('America/Argentina/Buenos_Aires').format('YYYY-MM-DD')

    const appliedFrom = fromDate || today
    const appliedTo = toDate || today

    const rangeResult = await getPaymentsInRangeCombined(gymId, appliedFrom, appliedTo)

    const pagosFiltrados = rangeResult.paymentsInRange.length
    const montoFiltrado = rangeResult.paymentsInRange.reduce((acc, p) => acc + (p.monto ?? 0), 0)

    return {
        pagosFiltrados,
        montoFiltrado,
        byMethod: rangeResult.byMethod,
        byTipo: rangeResult.byTipo,
        range: { fromDate: appliedFrom, toDate: appliedTo }
    }
}
