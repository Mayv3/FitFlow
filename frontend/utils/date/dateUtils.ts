import moment from 'moment-timezone';

const TZ = 'America/Argentina/Buenos_Aires';
export type EstadoCode = 'active' | 'expiring' | 'expired' | 'none';

moment.tz.setDefault('America/Argentina/Buenos_Aires');

export const fechaHoyArgentina = moment().format('DD/MM/YYYY');
export const fechaHoyArgentinaISO = moment().format('YYYY-MM-DD');
export const fechaHoyMasUnMesISO = moment().add(1, 'month').format('YYYY-MM-DD');
export const horaActualArgentina = moment.tz('America/Argentina/Buenos_Aires').format('HH:mm');

export const inicioDelMes = moment().startOf('month');
export const finDeMes = moment().endOf('month');
export const fechaHoyArgentinaSinFormato = moment().tz('America/Argentina/Buenos_Aires').startOf('day');

export const formatearFecha = (valor: string | Date | null | undefined): string => {
  if (!valor) return '—';

  const fecha = moment(valor);
  if (!fecha.isValid()) return '—';

  const formateada = fecha.format('DD/MM/YYYY');
  return formateada;
};
export const estadoVencimiento = (
  fecha: string | Date | null | undefined,
  diasAviso = 3
): { label: string; code: EstadoCode; daysDiff: number | null } => {
  if (!fecha) return { label: 'Sin plan', code: 'none', daysDiff: null };

  const hoy = moment.tz(TZ).startOf('day');
  const vence = moment.tz(fecha, TZ).endOf('day');
  const diff = vence.diff(hoy, 'days');

  if (diff < 0) return { label: 'Vencido', code: 'expired', daysDiff: diff };
  if (diff <= diasAviso) return { label: `Por vencer`, code: 'expiring', daysDiff: diff };
  return { label: 'Activo', code: 'active', daysDiff: diff };
};