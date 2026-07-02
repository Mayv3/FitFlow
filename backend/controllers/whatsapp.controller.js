import { whatsappManager } from '../services/whatsapp/WhatsappManager.js'
import { procesarRecordatorios, triggerAllGyms } from '../services/whatsapp/reminders.js'
import { supabaseAdmin } from '../config/supabaseClient.js'

function assertGymAccess(req, gymId) {
  const userGym = req.gymId
  if (!userGym) return false
  return String(userGym) === String(gymId)
}

async function isModuleEnabled(gymId) {
  const { data } = await supabaseAdmin
    .from('gyms')
    .select('settings')
    .eq('id', gymId)
    .maybeSingle()
  return !!data?.settings?.whatsapp_module_enabled
}

export async function postConnect(req, res) {
  const { gymId } = req.params
  if (!assertGymAccess(req, gymId)) return res.status(403).json({ error: 'forbidden' })
  if (!(await isModuleEnabled(gymId))) {
    return res.status(403).json({ error: 'whatsapp_module_disabled' })
  }
  try {
    await whatsappManager.connect(gymId)
    res.json(whatsappManager.getState(gymId))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

export async function getStatus(req, res) {
  const { gymId } = req.params
  if (!assertGymAccess(req, gymId)) return res.status(403).json({ error: 'forbidden' })

  const current = whatsappManager.getState(gymId)

  // Auto-restore: si no hay socket activo pero hay creds en DB y módulo habilitado,
  // arrancá la sesión sin pedir QR de nuevo.
  if (current.status === 'disconnected') {
    try {
      if (await isModuleEnabled(gymId)) {
        const { data: creds } = await supabaseAdmin
          .from('whatsapp_session')
          .select('id')
          .eq('gym_id', gymId)
          .eq('id', 'creds')
          .maybeSingle()
        if (creds) {
          whatsappManager.connect(gymId).catch((e) =>
            console.warn(`[wa ${gymId}] auto-restore failed:`, e.message)
          )
          return res.json({ ...current, status: 'connecting' })
        }
      }
    } catch (e) {
      console.warn(`[wa ${gymId}] auto-restore probe error:`, e.message)
    }
  }

  res.json(current)
}

export async function getQr(req, res) {
  const { gymId } = req.params
  if (!assertGymAccess(req, gymId)) return res.status(403).json({ error: 'forbidden' })
  const state = whatsappManager.getState(gymId)
  if (!state.qrDataUrl) {
    return res.status(404).json({ error: 'no_qr_available', status: state.status })
  }
  res.json({ qr: state.qr, qrDataUrl: state.qrDataUrl, status: state.status })
}

export async function postDisconnect(req, res) {
  const { gymId } = req.params
  if (!assertGymAccess(req, gymId)) return res.status(403).json({ error: 'forbidden' })
  try {
    await whatsappManager.disconnect(gymId)
    // Liberar el número: limpiar admin_jid para que pueda vincularse en otro gimnasio.
    const { data: gym } = await supabaseAdmin
      .from('gyms')
      .select('settings')
      .eq('id', gymId)
      .maybeSingle()
    const settings = gym?.settings || {}
    if (settings.whatsapp) settings.whatsapp = { ...settings.whatsapp, admin_jid: null }
    await supabaseAdmin
      .from('gyms')
      .update({ whatsapp_enabled: false, settings })
      .eq('id', gymId)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

export async function postTest(req, res) {
  const { gymId } = req.params
  const { jid, text } = req.body || {}
  if (!assertGymAccess(req, gymId)) return res.status(403).json({ error: 'forbidden' })
  if (!jid || !text) return res.status(400).json({ error: 'jid and text required' })
  try {
    await whatsappManager.sendText(gymId, jid, text)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

export async function postSimulate(req, res) {
  const { gymId } = req.params
  if (!assertGymAccess(req, gymId)) return res.status(403).json({ error: 'forbidden' })
  try {
    const result = await procesarRecordatorios(gymId, { simulate: true })
    res.json(result)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

export async function postTriggerGym(req, res) {
  const { gymId } = req.params
  if (!assertGymAccess(req, gymId)) return res.status(403).json({ error: 'forbidden' })
  try {
    const result = await procesarRecordatorios(gymId, { simulate: false })
    res.json(result)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

export async function postTriggerAll(req, res) {
  const secret = req.headers['x-cron-secret']
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'unauthorized' })
  }
  try {
    const result = await triggerAllGyms({ simulate: false })
    res.json({ ok: true, gyms: result })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

export async function getDryRunAll(req, res) {
  try {
    const result = await triggerAllGyms({ simulate: true })
    const gyms = result.map((r) => {
      const would_send = (r.results || [])
        .filter((m) => m.status === 'simulated')
        .map((m) => ({ alumno_id: m.alumno_id, jid: m.jid, text: m.text }))
      return {
        gym_id: r.gym_id,
        gym_name: r.gym_name,
        session: r.admin_jid ?? null,
        status: r.status,
        count: would_send.length,
        would_send,
        skipped: r.skipped ?? 0,
      }
    })
    res.json({ ok: true, total_would_send: gyms.reduce((s, g) => s + g.would_send.length, 0), gyms })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

export async function patchConfig(req, res) {
  const { gymId } = req.params
  if (!assertGymAccess(req, gymId)) return res.status(403).json({ error: 'forbidden' })
  const patch = req.body || {}
  // admin_jid lo gestiona el backend al conectar (no editable por el cliente:
  // es la clave de unicidad del número entre gimnasios).
  const allowed = ['country_prefix', 'reminder_days_before', 'send_delay_ms', 'template', 'enabled']
  const clean = {}
  for (const k of allowed) if (k in patch) clean[k] = patch[k]

  try {
    const { data: gym, error: e1 } = await supabaseAdmin
      .from('gyms')
      .select('settings,whatsapp_enabled')
      .eq('id', gymId)
      .maybeSingle()
    if (e1) throw e1
    if (!gym) return res.status(404).json({ error: 'gym not found' })

    const settings = gym.settings || {}
    settings.whatsapp = { ...(settings.whatsapp || {}), ...clean }

    const update = { settings }
    if (typeof clean.enabled === 'boolean') update.whatsapp_enabled = clean.enabled

    const { data, error } = await supabaseAdmin
      .from('gyms')
      .update(update)
      .eq('id', gymId)
      .select('settings,whatsapp_enabled')
      .single()
    if (error) throw error
    res.json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

export async function getConfig(req, res) {
  const { gymId } = req.params
  if (!assertGymAccess(req, gymId)) return res.status(403).json({ error: 'forbidden' })
  const { data, error } = await supabaseAdmin
    .from('gyms')
    .select('settings,whatsapp_enabled')
    .eq('id', gymId)
    .maybeSingle()
  if (error) return res.status(500).json({ error: error.message })
  res.json({
    whatsapp_enabled: data?.whatsapp_enabled || false,
    config: data?.settings?.whatsapp || {}
  })
}

export async function getMensajes(req, res) {
  const { gymId } = req.params
  if (!assertGymAccess(req, gymId)) return res.status(403).json({ error: 'forbidden' })
  const limit = Math.min(Number(req.query.limit) || 20, 1000)
  const { from, to } = req.query
  let q = supabaseAdmin
    .from('whatsapp_mensajes')
    .select('*')
    .eq('gym_id', gymId)
    .order('enviado_at', { ascending: false })
    .limit(limit)
  if (from) q = q.gte('enviado_at', from)
  if (to) q = q.lt('enviado_at', to)
  const { data, error } = await q
  if (error) return res.status(500).json({ error: error.message })
  res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120')
  res.json(data)
}

// Owner-only: mensajes de WhatsApp de TODOS los gimnasios en un rango.
// Cada fila incluye info del gym (nombre, logo) para agrupar en el detalle.
export async function getOwnerMensajes(req, res) {
  const { from, to } = req.query
  const limit = Math.min(Number(req.query.limit) || 5000, 10000)
  // Sanity guard: máximo 62 días por request (evita egress alto).
  if (from && to) {
    const fromMs = Date.parse(from), toMs = Date.parse(to)
    if (Number.isNaN(fromMs) || Number.isNaN(toMs) || (toMs - fromMs) > 62 * 24 * 3600 * 1000) {
      return res.status(400).json({ error: 'invalid range' })
    }
  }
  let q = supabaseAdmin
    .from('whatsapp_mensajes')
    .select('id, gym_id, nombre, telefono, plan, vencimiento, mensaje, estado, enviado_at')
    .order('enviado_at', { ascending: false })
    .limit(limit)
  if (from) q = q.gte('enviado_at', from)
  if (to) q = q.lt('enviado_at', to)
  const { data, error } = await q
  if (error) return res.status(500).json({ error: error.message })

  // Adjuntar info de gym (join en JS, sin depender de FK embed en PostgREST).
  const gymIds = [...new Set((data || []).map((r) => r.gym_id))]
  const gymMap = {}
  if (gymIds.length) {
    const { data: gyms } = await supabaseAdmin
      .from('gyms')
      .select('id, name, logo_url')
      .in('id', gymIds)
    for (const g of gyms || []) gymMap[g.id] = g
  }
  const rows = (data || []).map((r) => ({
    ...r,
    gym_nombre: gymMap[r.gym_id]?.name || 'Sin nombre',
    gym_logo: gymMap[r.gym_id]?.logo_url || null,
  }))

  res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120')
  res.json({ data: rows })
}

export async function getMensajesCalendar(req, res) {
  const { gymId } = req.params
  if (!assertGymAccess(req, gymId)) return res.status(403).json({ error: 'forbidden' })
  const { from, to } = req.query
  if (!from || !to) return res.status(400).json({ error: 'from and to required (ISO)' })
  // Sanity guard: máximo 62 días (2 meses) por request para evitar egress alto.
  const fromMs = Date.parse(from), toMs = Date.parse(to)
  if (Number.isNaN(fromMs) || Number.isNaN(toMs) || (toMs - fromMs) > 62 * 24 * 3600 * 1000) {
    return res.status(400).json({ error: 'invalid range' })
  }
  const { data, error } = await supabaseAdmin
    .from('whatsapp_mensajes')
    .select('enviado_at')
    .eq('gym_id', gymId)
    .gte('enviado_at', from)
    .lt('enviado_at', to)
    .order('enviado_at', { ascending: false })
    .limit(2000)
  if (error) return res.status(500).json({ error: error.message })
  const byDay = {}
  for (const row of data || []) {
    const d = new Date(row.enviado_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    byDay[key] = (byDay[key] || 0) + 1
  }
  res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120')
  res.json({ byDay })
}
