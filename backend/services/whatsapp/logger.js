import { supabaseAdmin } from '../../config/supabaseClient.js'

// Logs del módulo de WhatsApp pensados para leerse desde Render sin tener el
// código al lado. Antes una caída se veía así:
//
//   [wa fd56aa99-df25-49df-9f05-c6a9cee80126] closed (440) loggedOut=false restart=false replaced=true forbidden=false
//
// Eso obliga a saber de memoria qué es un 440 y a buscar qué gym es ese UUID.
// Ahora cada evento dice el nombre del gym, qué pasó en castellano, qué hace el
// backend solo y si los recordatorios se están enviando o no.

const TZ = 'America/Argentina/Buenos_Aires'

// gymId -> nombre. Se llena solo: cualquier módulo que ya tenga el nombre a mano
// lo deja acá, y si no está se busca una vez en la DB.
const gymNames = new Map()

export function rememberGymName(gymId, name) {
  if (gymId && name) gymNames.set(gymId, name)
}

// Etiqueta sincrónica: loguear no puede esperar a la DB. Si todavía no sabemos
// el nombre, se usan los primeros 8 chars del UUID (suficiente para distinguir).
// gymId null = evento global (corrida de todos los gyms), sin etiqueta.
function gymLabel(gymId) {
  if (!gymId) return ''
  return `${gymNames.get(gymId) || `gym:${String(gymId).slice(0, 8)}`} `
}

// Busca el nombre en segundo plano para que los logs siguientes ya salgan
// legibles. Best-effort: si falla, se sigue logueando con el UUID corto.
export function primeGymName(gymId) {
  if (!gymId || gymNames.has(gymId)) return
  supabaseAdmin
    .from('gyms')
    .select('name')
    .eq('id', gymId)
    .maybeSingle()
    .then(({ data }) => rememberGymName(gymId, data?.name))
    .catch(() => {})
}

function hora() {
  return new Date().toLocaleTimeString('es-AR', { timeZone: TZ, hour12: false })
}

const MARCA = { info: '·', ok: '✓', warn: '⚠', error: '✖', start: '▶', end: '■' }

/**
 * Loguea un evento de WhatsApp con formato uniforme.
 *
 * @param {string} gymId
 * @param {string} titulo   qué pasó, en una línea
 * @param {object} [opts]
 * @param {'info'|'ok'|'warn'|'error'|'start'|'end'} [opts.level]
 * @param {Record<string,string|number|null|undefined>} [opts.detalle]
 *        pares etiqueta→texto que se imprimen indentados debajo del título
 */
export function waLog(gymId, titulo, { level = 'info', detalle = null } = {}) {
  const salida =
    level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
  salida(`${hora()} [wa] ${gymLabel(gymId)}${MARCA[level] || '·'} ${titulo}`)
  for (const [k, v] of Object.entries(detalle || {})) {
    if (v === null || v === undefined || v === '') continue
    salida(`            ${k}: ${v}`)
  }
}

// Traducción de los códigos de cierre de Baileys. `accion` es lo que hace el
// backend por su cuenta; `efecto` aclara si los recordatorios siguen saliendo,
// que es la pregunta real cuando uno mira estos logs.
const CIERRES = {
  401: {
    nombre: 'loggedOut',
    pasa: 'WhatsApp cerró la sesión. El dispositivo "FitFlow (Ubuntu)" fue eliminado desde el celular, o se reinstaló/cambió el teléfono.',
    accion: 'Borro las credenciales (ya no sirven) y mando mail de aviso.',
    efecto: 'NO se envía nada hasta escanear un QR nuevo desde el panel del gym.',
    level: 'error'
  },
  403: {
    nombre: 'forbidden',
    pasa: 'WhatsApp rechazó la cuenta. Suele ser por patrón de envío masivo a números que no te tienen agendado.',
    accion: 'Dejo de reintentar y conservo las credenciales por si es restricción temporal.',
    efecto: 'NO se envía nada. Revisar el número en el celular vinculado por si hay aviso de cuenta restringida.',
    level: 'error'
  },
  408: {
    nombre: 'connectionLost / timedOut',
    pasa: 'Se cortó la conexión con WhatsApp (red o timeout).',
    accion: 'Reconecto solo con backoff exponencial (3s, 6s, 12s… tope 5min).',
    efecto: 'Pausado hasta reconectar. Normalmente se arregla solo.',
    level: 'warn'
  },
  411: {
    nombre: 'multideviceMismatch',
    pasa: 'Desajuste de multi-device entre el server y el teléfono.',
    accion: 'Reconecto solo con backoff.',
    efecto: 'Si se repite seguido, hay que re-vincular con QR.',
    level: 'warn'
  },
  428: {
    nombre: 'connectionClosed',
    pasa: 'WhatsApp cerró el socket sin dar motivo puntual.',
    accion: 'Reconecto solo con backoff exponencial.',
    efecto: 'Pausado hasta reconectar. Normalmente se arregla solo.',
    level: 'warn'
  },
  440: {
    nombre: 'connectionReplaced',
    pasa: 'Otra conexión tomó esta sesión: hay un segundo proceso usando las MISMAS credenciales (deploy con dos instancias solapadas, o el server corriendo dos veces).',
    accion: 'Cedo la sesión para no entrar en guerra de reconexiones, y reviso a los 90s si quedé caído.',
    efecto: 'Los envíos de este rato fallan con "not connected". Si se repite, hay dos procesos vivos: dejar uno solo.',
    level: 'warn'
  },
  500: {
    nombre: 'badSession',
    pasa: 'Las credenciales quedaron corruptas.',
    accion: 'Reconecto solo con backoff.',
    efecto: 'Si insiste, desvincular y escanear QR nuevo.',
    level: 'error'
  },
  503: {
    nombre: 'unavailableService',
    pasa: 'Servicio de WhatsApp no disponible.',
    accion: 'Reconecto solo con backoff.',
    efecto: 'Pausado hasta que WhatsApp responda.',
    level: 'warn'
  },
  515: {
    nombre: 'restartRequired',
    pasa: 'WhatsApp pide reiniciar el socket. Es parte normal del handshake después de escanear el QR.',
    accion: 'Reabro la conexión en 200ms.',
    efecto: 'Ninguno, es esperable.',
    level: 'info'
  }
}

export function explicarCierre(code) {
  return (
    CIERRES[code] || {
      nombre: 'desconocido',
      pasa: `WhatsApp cerró la conexión con código ${code ?? 'sin código'}.`,
      accion: 'Reconecto solo con backoff exponencial.',
      efecto: 'Pausado hasta reconectar.',
      level: 'warn'
    }
  )
}

/**
 * Loguea un cierre de conexión ya traducido.
 * @param {string} gymId
 * @param {number|undefined} code  statusCode de Baileys
 * @param {Record<string,string|number>} [extra]  campos propios del caso
 */
export function logCierre(gymId, code, extra = {}) {
  const info = explicarCierre(code)
  waLog(gymId, `Conexión cerrada — ${code ?? '?'} (${info.nombre})`, {
    level: info.level,
    detalle: {
      'Qué pasó': info.pasa,
      'Qué hago': info.accion,
      'Recordatorios': info.efecto,
      ...extra
    }
  })
}

// Formatea una duración en algo legible ("1m 12s"), para el resumen de corrida.
export function duracion(ms) {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return `${m}m ${s % 60}s`
}
