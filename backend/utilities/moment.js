import moment from 'moment-timezone'

const TZ = 'America/Argentina/Buenos_Aires'

export const fechaArgentina = () =>
    moment().tz(TZ).format('YYYY-MM-DD')
  export const horaArgentina = () =>
    moment().tz(TZ).format('HH:mm:ss')