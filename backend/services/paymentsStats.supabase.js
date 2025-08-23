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

async function getTodaysPayments(gymId, today) {
    let q = supabaseAdmin.from('pagos').select('monto').eq('fecha_de_pago', today);
    if (gymId) q = q.eq('gym_id', gymId);
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
}

async function getPaymentsByMethod(gymId) {
    let q = supabaseAdmin
        .from('pagos')
        .select('metodo_de_pago_id, monto, metodos_de_pago(nombre)');
    if (gymId) q = q.eq('gym_id', gymId);

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

async function getPaymentsByTipo(gymId, today) {
    let q = supabaseAdmin
        .from('pagos')
        .select('tipo, monto', { head: false });

    if (gymId) q = q.eq('gym_id', gymId);
    q = q.eq('fecha_de_pago', today);

    const { data, error } = await q;
    if (error) throw error;

    const grouped = {};
    for (const row of data ?? []) {
        const key = row.tipo || 'Otro';
        grouped[key] = grouped[key] || { tipo: key, count: 0, monto: 0 };
        grouped[key].count += 1;
        grouped[key].monto += Number(row.monto || 0);
    }

    return Object.values(grouped);
}

export async function getPaymentsStatsService({ gymId } = {}) {
    const today = getTodayArgentina();
  
    const [allPayments, todaysPayments, byMethod, byTipo] = await Promise.all([
      getAllPayments(gymId),
      getTodaysPayments(gymId, today),
      getPaymentsByMethod(gymId),
      getPaymentsByTipo(gymId, today),
    ]);
  
    const totalPagos = allPayments.length;
    const totalMonto = allPayments.reduce((acc, p) => acc + (p.monto ?? 0), 0);
  
    const pagosHoy = todaysPayments.length;
    const montoHoy = todaysPayments.reduce((acc, p) => acc + (p.monto ?? 0), 0);
  
    return {
      totalPagos,
      totalMonto,
      pagosHoy,
      montoHoy,
      byMethod,
      byTipo,
    };
  }
  
