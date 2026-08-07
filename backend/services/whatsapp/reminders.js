import dayjs from 'dayjs'
import { supabaseAdmin } from '../../config/supabaseClient.js'
import { whatsappManager } from './WhatsappManager.js'
import { notifyWaDown } from './notify.js'
import { waLog, rememberGymName, duracion } from './logger.js'

const DEFAULT_TEMPLATE =
  'Hola {nombre}, tu plan {plan} {estado} el {fecha}. ¡Renoválo para seguir entrenando! 💪'

function fmt(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')
}

// Delay fijo entre envíos = patrón robótico, señal de riesgo pal antispam de
// WhatsApp. Random uniforme entre 5s y 13s para que el intervalo no sea
// siempre idéntico.
function withJitter() {
  return Math.round(5000 + Math.random() * 8000)
}

// Ráfaga continua (aunque tenga jitter) es señal de bot pal antispam. Cada
// TANDA_SIZE envíos, una pausa larga random en vez de la jitter normal —
// simula un humano que corta a mandar mensajes cada tanto.
const TANDA_SIZE = 25
function withTandaPause() {
  return Math.round(60000 + Math.random() * 60000)
}

// ── Corridas en curso y cancelación ──────────────────────────────────────────
// Una corrida de 150 alumnos tarda ~20 minutos por el jitter entre envíos. Si
// se disparó por error hay que poder frenarla sin reiniciar el server: cada
// corrida se registra acá y el loop chequea la bandera antes de cada mensaje.
// Los ya enviados NO se deshacen — cancelar solo evita los que faltan.

/** @type {Map<string, {gymId:string, gymName:string|null, simulate:boolean, startedAt:number, total:number, sent:number, errors:number, skipped:number, cancelada:boolean, cancelPor:string|null, despertar:(()=>void)|null}>} */
const corridas = new Map()

function nuevaCorrida(gymId, { gymName, simulate, total }) {
  const run = {
    gymId,
    gymName,
    simulate,
    startedAt: Date.now(),
    total,
    sent: 0,
    errors: 0,
    skipped: 0,
    cancelada: false,
    cancelPor: null,
    despertar: null
  }
  corridas.set(gymId, run)
  return run
}

// Espera entre envíos, pero cortable: si cancelan mientras duerme, sigue de
// largo en vez de dejar al usuario esperando hasta 13s a que reaccione el botón.
function esperar(ms, run) {
  return new Promise((resolve) => {
    const t = setTimeout(() => {
      run.despertar = null
      resolve()
    }, ms)
    run.despertar = () => {
      clearTimeout(t)
      run.despertar = null
      resolve()
    }
  })
}

/**
 * Marca una corrida para que frene antes del próximo mensaje.
 * @param {string} gymId
 * @param {string} [porQuien] email o id del usuario, para el log
 * @returns {{ok:boolean, sent:number, restantes:number}|null} null si no había nada corriendo
 */
export function cancelarEnvio(gymId, porQuien = 'desconocido') {
  const run = corridas.get(gymId)
  if (!run || run.cancelada) return null
  run.cancelada = true
  run.cancelPor = porQuien
  run.despertar?.() // cortar la espera entre mensajes, para que frene ya
  waLog(gymId, 'CANCELACIÓN pedida — freno antes del próximo mensaje', {
    level: 'warn',
    detalle: {
      Pedido: `por ${porQuien}`,
      'Ya enviados': `${run.sent} (esos no se pueden deshacer)`,
      'Quedaban sin enviar': Math.max(0, run.total - run.sent - run.errors - run.skipped)
    }
  })
  return {
    ok: true,
    sent: run.sent,
    restantes: Math.max(0, run.total - run.sent - run.errors - run.skipped)
  }
}

/** Cancela todas las corridas activas de todos los gimnasios. */
export function cancelarTodo(porQuien = 'desconocido') {
  const frenadas = []
  for (const gymId of corridas.keys()) {
    const r = cancelarEnvio(gymId, porQuien)
    if (r) frenadas.push({ gym_id: gymId, ...r })
  }
  if (!frenadas.length) {
    waLog(null, 'Pedido de cancelación pero no había ningún envío en curso', { level: 'warn' })
  }
  return frenadas
}

/** Snapshot de lo que está corriendo ahora, para que el panel muestre progreso. */
export function estadoCorridas() {
  return [...corridas.values()].map((r) => ({
    gym_id: r.gymId,
    gym_name: r.gymName,
    simulate: r.simulate,
    total: r.total,
    sent: r.sent,
    errors: r.errors,
    skipped: r.skipped,
    restantes: Math.max(0, r.total - r.sent - r.errors - r.skipped),
    cancelada: r.cancelada,
    segundos: Math.round((Date.now() - r.startedAt) / 1000)
  }))
}

async function getGymConfig(gymId) {
  const { data, error } = await supabaseAdmin
    .from('gyms')
    .select('id,name,settings,whatsapp_enabled')
    .eq('id', gymId)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error(`gym ${gymId} not found`)
  rememberGymName(gymId, data.name) // los logs de acá en más salen con nombre
  const wa = data.settings?.whatsapp || {}
  return {
    gym: data,
    moduleEnabled: !!data.settings?.whatsapp_module_enabled,
    countryPrefix: wa.country_prefix || '549',
    daysBefore: Number.isFinite(wa.reminder_days_before) ? wa.reminder_days_before : 3,
    template: wa.template || DEFAULT_TEMPLATE,
    adminJid: wa.admin_jid || null
  }
}

async function fetchAlumnosToRemind(gymId, daysBefore) {
  const today = dayjs().startOf('day')
  // Recordatorio previo deshabilitado por ahora — solo se avisa el día que vence.
  // (daysBefore queda sin usar; para reactivar, sumar de nuevo today.add(daysBefore, 'day'))
  const dueDays = [today.format('YYYY-MM-DD')]

  const { data, error } = await supabaseAdmin
    .from('alumnos')
    .select('id,nombre,telefono,fecha_de_vencimiento,plan_id,planes_precios(nombre)')
    .eq('gym_id', gymId)
    .in('fecha_de_vencimiento', dueDays)
    .is('deleted_at', null)
  if (error) throw error
  return (data || []).filter((a) => a.telefono)
}

// Dos avisos por ciclo: 'recordatorio_previo' (N días antes) y
// 'recordatorio_vencimiento' (el día del vencimiento).
const REMINDER_TIPOS = ['recordatorio_previo', 'recordatorio_vencimiento']

async function fetchAlreadySent(gymId, alumnoIds, vencimientos) {
  if (!alumnoIds.length) return new Set()
  // Filtrar por las vencimiento dates exactas en juego — evita traer historia entera.
  const uniqueVenc = Array.from(new Set(vencimientos.filter(Boolean)))
  if (!uniqueVenc.length) return new Set()
  const { data, error } = await supabaseAdmin
    .from('whatsapp_mensajes')
    .select('alumno_id,vencimiento,tipo')
    .eq('gym_id', gymId)
    .in('tipo', REMINDER_TIPOS)
    .eq('estado', 'enviado')
    .in('alumno_id', alumnoIds)
    .in('vencimiento', uniqueVenc)
  if (error) {
    waLog(gymId, 'No pude leer qué alumnos ya fueron avisados', {
      level: 'warn',
      detalle: {
        Error: error.message,
        'Qué implica': 'Sin dedupe: alumnos que ya recibieron el aviso pueden recibirlo de nuevo.'
      }
    })
    return new Set()
  }
  // Key incluye el tipo de aviso: cada alumno puede recibir el previo Y el del día
  // (mismo vencimiento), pero cada uno una sola vez.
  return new Set((data || []).map((r) => `${r.alumno_id}|${r.vencimiento}|${r.tipo}`))
}

async function logMensaje(row) {
  const { error } = await supabaseAdmin.from('whatsapp_mensajes').insert(row)
  if (error) {
    waLog(row.gym_id, `El mensaje salió pero no quedó registrado en la base — ${row.nombre}`, {
      level: 'warn',
      detalle: {
        Error: error.message,
        'Qué implica': 'No aparece en el historial del panel y el dedupe puede reenviarlo.'
      }
    })
  }
}

export async function procesarRecordatorios(gymId, { simulate = false } = {}) {
  const t0 = Date.now()
  const cfg = await getGymConfig(gymId)
  if (!cfg.moduleEnabled) {
    waLog(gymId, 'Corrida salteada: el módulo de WhatsApp está apagado para este gym', {
      detalle: { 'Dónde se prende': 'gyms.settings.whatsapp_module_enabled' }
    })
    return { gym_id: gymId, status: 'module_disabled', sent: 0, errors: 0 }
  }
  if (!cfg.gym.whatsapp_enabled) {
    waLog(gymId, 'Corrida salteada: los envíos están pausados para este gym', {
      detalle: { 'Dónde se prende': 'gyms.whatsapp_enabled' }
    })
    return { gym_id: gymId, status: 'disabled', sent: 0, errors: 0 }
  }

  if (!simulate && !whatsappManager.isConnected(gymId)) {
    // El módulo está habilitado pero el socket no está conectado: los recordatorios
    // NO se envían. Antes fallaba mudo (así estuvimos días caídos sin enterarnos).
    const waStatus = whatsappManager.getState(gymId)?.status ?? 'none'
    waLog(gymId, 'Corrida abortada: WhatsApp no está conectado', {
      level: 'error',
      detalle: {
        Estado: waStatus,
        Recordatorios: 'NO se envió NINGUNO en esta corrida.',
        'Qué hacer': 'Ver el último "Conexión cerrada" de este gym más arriba en el log.'
      }
    })
    notifyWaDown(gymId, 'not_connected', `status=${waStatus}`).catch(() => {})
    return {
      gym_id: gymId,
      status: 'not_connected',
      sent: 0,
      errors: 0,
      message: 'WhatsApp no conectado para este gym'
    }
  }

  const alumnos = await fetchAlumnosToRemind(gymId, cfg.daysBefore)

  // Dedupe: si ya se envió pa ese alumno+vencimiento, saltar.
  // Aplica TAMBIÉN en simulate: la vista previa muestra solo lo que se mandaría
  // ahora (alumnos nuevos), nunca lo ya enviado en corridas previas.
  const sentSet = await fetchAlreadySent(
    gymId,
    alumnos.map((a) => a.id),
    alumnos.map((a) => a.fecha_de_vencimiento)
  )

  let sent = 0
  let errors = 0
  let skipped = 0
  let pending = 0
  let enTanda = 0
  const results = []
  const today = dayjs().startOf('day')

  const aEnviar = alumnos.length - sentSet.size
  const tandas = Math.floor(Math.max(0, aEnviar - 1) / TANDA_SIZE)
  waLog(gymId, simulate ? 'Simulación de recordatorios' : 'Arranca envío de recordatorios', {
    level: 'start',
    detalle: {
      Candidatos: alumnos.length,
      'Ya enviados antes': sentSet.size,
      'Días de aviso previo': cfg.daysBefore,
      'Tiempo estimado': simulate
        ? '—'
        : `~${duracion(aEnviar * 9000 + tandas * 90000)} (9s promedio entre envíos + pausa larga cada ${TANDA_SIZE})`,
      'Se puede frenar': simulate ? '—' : 'sí, con el botón Cancelar del panel'
    }
  })

  // Una sola corrida por gym a la vez. Sin esto, si el cron y el botón del panel
  // se pisan, la segunda corrida sobrescribe el registro de la primera y el
  // botón Cancelar deja de tener efecto sobre la que realmente está enviando.
  if (corridas.has(gymId)) {
    const enCurso = corridas.get(gymId)
    waLog(gymId, 'Ya hay un envío en curso para este gym — no arranco otro', {
      level: 'warn',
      detalle: { 'Progreso del que corre': `${enCurso.sent}/${enCurso.total}` }
    })
    return { gym_id: gymId, status: 'already_running', sent: 0, errors: 0, skipped: 0 }
  }

  // Registrar la corrida para que el botón Cancelar tenga qué frenar. La
  // simulación no envía nada, pero se registra igual para que el panel sepa
  // que hay algo en curso.
  const run = nuevaCorrida(gymId, { gymName: cfg.gym.name ?? null, simulate, total: alumnos.length })
  let cancelada = false

  try {
    for (const a of alumnos) {
      // Corte por cancelación: se chequea ANTES de armar y mandar el mensaje, así
      // el último enviado es siempre uno completo (nunca queda a medias).
      if (run.cancelada) {
        cancelada = true
        break
      }

      const venc = dayjs(a.fecha_de_vencimiento).startOf('day')
      const diffDays = venc.diff(today, 'day')
      // Aviso del día de vencimiento vs aviso previo (N días antes).
      const tipo = diffDays <= 0 ? 'recordatorio_vencimiento' : 'recordatorio_previo'
      const dedupeKey = `${a.id}|${a.fecha_de_vencimiento}|${tipo}`
      if (sentSet.has(dedupeKey)) {
        skipped++
        run.skipped = skipped
        results.push({ alumno_id: a.id, status: 'already_sent' })
        continue
      }

      const planNombre = a.planes_precios?.nombre || ''
      const fecha = venc.format('D/M/YYYY')
      const estado = diffDays < 0 ? 'venció' : (diffDays === 0 ? 'vence hoy' : 'vence')
      const text = fmt(cfg.template, { nombre: a.nombre, plan: planNombre, fecha, estado })
      const jid = whatsappManager.buildJid(a.telefono, cfg.countryPrefix)

      if (!jid) {
        errors++
        run.errors = errors
        waLog(gymId, `Teléfono inválido — ${a.nombre}`, {
          level: 'warn',
          detalle: { 'Guardado en la ficha': a.telefono, 'Qué hago': 'Salteo este alumno.' }
        })
        results.push({ alumno_id: a.id, status: 'invalid_phone' })
        continue
      }

      if (simulate) {
        pending++
        results.push({ alumno_id: a.id, jid, text, status: 'simulated' })
        continue
      }

      try {
        await whatsappManager.sendText(gymId, jid, text)
        sent++
        run.sent = sent
        await logMensaje({
          gym_id: gymId,
          alumno_id: a.id,
          telefono: a.telefono,
          nombre: a.nombre,
          plan: planNombre,
          vencimiento: a.fecha_de_vencimiento,
          mensaje: text,
          tipo,
          estado: 'enviado',
          remitente_jid: cfg.adminJid
        })
        waLog(gymId, `Enviado ${sent}/${alumnos.length - skipped} — ${a.nombre}`, {
          level: 'ok',
          detalle: { Teléfono: a.telefono, Aviso: tipo, Vence: fecha }
        })
        results.push({ alumno_id: a.id, status: 'sent' })
      } catch (e) {
        errors++
        run.errors = errors
        waLog(gymId, `Falló el envío a ${a.nombre}`, {
          level: 'error',
          detalle: { Teléfono: a.telefono, Motivo: e.message }
        })
        await logMensaje({
          gym_id: gymId,
          alumno_id: a.id,
          telefono: a.telefono,
          nombre: a.nombre,
          plan: planNombre,
          vencimiento: a.fecha_de_vencimiento,
          mensaje: text,
          tipo,
          estado: 'error',
          error_msg: e.message,
          remitente_jid: cfg.adminJid
        })
        results.push({ alumno_id: a.id, status: 'error', error: e.message })
      }

      enTanda++
      if (enTanda % TANDA_SIZE === 0) {
        const pausaMs = withTandaPause()
        waLog(gymId, `Pausa larga cada ${TANDA_SIZE} envíos — ${duracion(pausaMs)}`, {
          detalle: { Progreso: `${sent + errors}/${alumnos.length - skipped}` }
        })
        await esperar(pausaMs, run)
      } else {
        await esperar(withJitter(), run)
      }
    }
  } finally {
    // Sacar la corrida del registro pase lo que pase: si queda colgada, el panel
    // muestra para siempre un envío en curso que no existe.
    corridas.delete(gymId)
  }

  const restantes = Math.max(0, alumnos.length - sent - errors - skipped)
  waLog(
    gymId,
    cancelada ? 'ENVÍO CANCELADO a mano' : simulate ? 'Simulación terminada' : 'Envío terminado',
    {
      level: cancelada || errors > 0 ? 'warn' : 'end',
      detalle: {
        Enviados: sent,
        Errores: errors,
        'Salteados (ya avisados)': skipped,
        'Sin enviar por la cancelación': cancelada ? restantes : undefined,
        'A enviar (simulación)': simulate ? pending : undefined,
        Duración: duracion(Date.now() - t0)
      }
    }
  )

  return {
    gym_id: gymId,
    gym_name: cfg.gym.name ?? null,
    admin_jid: cfg.adminJid,
    status: cancelada ? 'cancelled' : 'ok',
    cancelled: cancelada,
    remaining: cancelada ? restantes : 0,
    sent,
    errors,
    skipped,
    pending,
    total: alumnos.length,
    results
  }
}

export async function triggerAllGyms({ simulate = false } = {}) {
  const { data, error } = await supabaseAdmin
    .from('gyms')
    .select('id,settings,whatsapp_enabled')
    .eq('whatsapp_enabled', true)
    .is('deleted_at', null)
  if (error) throw error

  const eligibles = (data || []).filter((g) => !!g.settings?.whatsapp_module_enabled)

  const t0 = Date.now()
  waLog(null, `===== ${simulate ? 'SIMULACIÓN' : 'CORRIDA'} de recordatorios: ${eligibles.length} gimnasios =====`, {
    level: 'start'
  })

  // Cada gym tiene su propia conexión WhatsApp y su propio candado de corrida
  // (corridas.has(gymId)) — no se pisan entre sí, van todos en paralelo.
  // cancelarTodo() sigue funcionando: recorre corridas.keys() y frena cada una
  // ya registrada, sin necesitar frenar "antes de que arranque" como en el loop viejo.
  const out = await Promise.all(
    eligibles.map(async (g) => {
      try {
        return await procesarRecordatorios(g.id, { simulate })
      } catch (e) {
        waLog(g.id, 'La corrida de este gym se cortó por un error', {
          level: 'error',
          detalle: { Error: e.message, 'Qué hago': 'Sigo con el resto de los gimnasios.' }
        })
        return { gym_id: g.id, status: 'error', error: e.message }
      }
    })
  )

  const totalSent = out.reduce((s, r) => s + (r.sent || 0), 0)
  const totalErrors = out.reduce((s, r) => s + (r.errors || 0), 0)
  const caidos = out.filter((r) => r.status === 'not_connected').length
  const cancelados = out.filter((r) => r.cancelled).length
  waLog(
    null,
    `===== ${cancelados ? 'CANCELADA' : 'Fin'}: ${totalSent} enviados, ${totalErrors} errores en ${duracion(Date.now() - t0)} =====`,
    {
      level: totalErrors > 0 || caidos > 0 ? 'warn' : 'end',
      detalle: {
        'Gyms sin WhatsApp conectado': caidos || undefined,
        'Gyms cancelados a mano': cancelados || undefined
      }
    }
  )
  return out
}

export async function ensureConnectedGyms() {
  const { data, error } = await supabaseAdmin
    .from('gyms')
    .select('id,settings')
    .eq('whatsapp_enabled', true)
    .is('deleted_at', null)
  if (error) throw error

  const eligibles = (data || []).filter((g) => !!g.settings?.whatsapp_module_enabled)

  for (const g of eligibles) {
    try {
      // probe: ¿hay creds guardadas?
      const { data: row } = await supabaseAdmin
        .from('whatsapp_session')
        .select('id')
        .eq('gym_id', g.id)
        .eq('id', 'creds')
        .maybeSingle()
      if (row) {
        whatsappManager.connect(g.id).catch((e) =>
          waLog(g.id, 'Falló la reconexión automática al arrancar el server', {
            level: 'error',
            detalle: { Error: e.message }
          })
        )
      } else {
        waLog(g.id, 'Sin credenciales guardadas — no reconecto', {
          detalle: { 'Qué hacer': 'Escanear el QR desde el panel del gym.' }
        })
      }
    } catch (e) {
      waLog(g.id, 'No pude verificar si hay credenciales guardadas', {
        level: 'warn',
        detalle: { Error: e.message }
      })
    }
  }
}
