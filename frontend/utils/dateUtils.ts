import moment from 'moment-timezone';

moment.tz.setDefault('America/Argentina/Buenos_Aires');

export const formatearFecha = (valor: string | Date | null | undefined): string => {
  if (!valor) return '—';

  const fecha = moment(valor);
  if (!fecha.isValid()) return '—';

  const formateada = fecha.format('DD/MM/YYYY');
  console.log('Fecha formateada:', formateada);

  return formateada;
};
