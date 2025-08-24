import { supabaseAdmin } from '../db/supabaseClient.js';
import moment from 'moment-timezone';

function getTodayArgentina() {
    return moment().tz('America/Argentina/Buenos_Aires').format('YYYY-MM-DD');
}

async function getAllPayments(gymId) {
    let q = supabaseAdmin.from('pagos').select('monto');
    if (gymId) q = q.eq('gym_id', gymId);
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
}

async function getPaymentsInRange(gymId, fromDate, toDate) {
    let q = supabaseAdmin
        .from('pagos')
        .select('monto')
        .is('deleted_at', null);

    if (gymId) q = q.eq('gym_id', gymId);
    if (fromDate) q = q.gte('fecha_de_pago', fromDate);
    if (toDate) q = q.lte('fecha_de_pago', toDate);

    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
}

async function getPaymentsByMethod(gymId, fromDate, toDate) {
    let q = supabaseAdmin
        .from('pagos')
        .select('metodo_de_pago_id, monto, metodos_de_pago(nombre)')
        .is('deleted_at', null);

    if (gymId) q = q.eq('gym_id', gymId);
    if (fromDate) q = q.gte('fecha_de_pago', fromDate);
    if (toDate) q = q.lte('fecha_de_pago', toDate);

    const { data, error } = await q;
    if (error) throw error;

    const grouped = {};
    (data ?? []).forEach((row) => {
        const metodo = row.metodos_de_pago?.nombre ?? String(row.metodo_de_pago_id ?? 'Otro');
        if (!grouped[metodo]) grouped[metodo] = { metodo, count: 0, monto: 0 };
        grouped[metodo].count += 1;
        grouped[metodo].monto += row.monto ?? 0;
    });

    return Object.values(grouped);
}

async function getPaymentsByTipo(gymId, fromDate, toDate) {
    let q = supabaseAdmin
        .from('pagos')
        .select('tipo, monto')
        .is('deleted_at', null);

    if (gymId) q = q.eq('gym_id', gymId);
    if (fromDate) q = q.gte('fecha_de_pago', fromDate);
    if (toDate) q = q.lte('fecha_de_pago', toDate);

    const { data, error } = await q;
    if (error) throw error;

    const grouped = {};
    (data ?? []).forEach((row) => {
        const key = row.tipo || 'Otro';
        if (!grouped[key]) grouped[key] = { tipo: key, count: 0, monto: 0 };
        grouped[key].count += 1;
        grouped[key].monto += Number(row.monto || 0);
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

