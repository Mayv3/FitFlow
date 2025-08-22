import moment from 'moment-timezone';

export const fechaArgentina = moment().tz('America/Argentina/Buenos_Aires').format('DD/MM/YYYY');
export const horaArgentina = moment().tz('America/Argentina/Buenos_Aires').format('HH:mm:ss');

export const getFechaHoraArgentinaISO = () =>
    moment().tz(TZ).format();