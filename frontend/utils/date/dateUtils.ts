import moment from 'moment-timezone';

moment.tz.setDefault('America/Argentina/Buenos_Aires');

export const fechaHoyArgentina = moment().format('DD/MM/YYYY');
export const fechaHoyArgentinaISO = moment().format('YYYY-MM-DD');
export const fechaHoyMasUnMesISO = moment().add(1, 'month').format('YYYY-MM-DD');

export const formatearFecha = (valor: string | Date | null | undefined): string => {
  if (!valor) return '—';

  const fecha = moment(valor);
  if (!fecha.isValid()) return '—';

  const formateada = fecha.format('DD/MM/YYYY');
  return formateada;
};
