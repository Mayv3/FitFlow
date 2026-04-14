import { supabaseAdmin } from '../db/supabaseClient.js'
import { createGym, listGyms, updateGym, updateGymWhatsapp, softDeleteGym, listDeletedGyms, restoreGym } from '../services/gyms.supabase.js'
import { enviarRecordatoriosWhatsApp } from '../jobs/whatsapp.cron.js'

export async function handleCreateGym(req, res) {
  try {
    const { name, settings, logo_url } = req.body
    if (!name) {
      return res.status(400).json({ error: 'El nombre del gimnasio es requerido' })
    }

    const gym = await createGym({
      name,
      settings: settings ?? {},
      logo_url: logo_url ?? null
    })

    return res.status(201).json(gym)
  } catch (err) {
    console.error('Error al crear gimnasio:', err)
    return res.status(500).json({ error: err.message })
  }
}

export async function handleListGyms(req, res) {
  try {
    const gyms = await listGyms()
    res.json(gyms)
  } catch (err) {
    console.error('Error al listar gimnasios:', err)
    res.status(500).json({ error: err.message })
  }
}

export async function handleGetGym(req, res) {
  try {
    const { id } = req.params
    const includeSettings = String(req.query.include_settings || "").toLowerCase() === "true"
    const fields = includeSettings ? "id, name, logo_url, settings" : "id, name, logo_url"

    const { data, error } = await supabaseAdmin
      .from("gyms")
      .select(fields)
      .eq("id", id)
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: "Gimnasio no encontrado" })
    res.json(data)
  } catch (err) {
    console.error("Error al obtener gimnasio:", err)
    res.status(500).json({ error: err.message })
  }
}

export const handleUpdateGymSettings = async (req, res) => {
  try {
    const gymId = req.user.user_metadata.gym_id;
    const settings = req.body

    console.log(settings)
    console.log(gymId)

    if (!gymId) {
      return res.status(400).json({ error: "No se encontró gym_id en el token" })
    }

    const { data, error } = await supabaseAdmin
      .from("gyms")
      .update({ settings: settings })
      .eq("id", gymId)
      .select()
      .single()

    if (error) throw error

    res.json(data)
  } catch (err) {
    console.error("Error al actualizar settings:", err)
    res.status(500).json({ error: "No se pudo actualizar el tema del gym" })
  }
}

export async function handleUpdateGymWhatsapp(req, res) {
  try {
    const { id } = req.params
    const { whatsapp_enabled } = req.body

    if (!id) return res.status(400).json({ error: 'ID de gimnasio requerido' })

    const gym = await updateGymWhatsapp(id, { whatsapp_enabled })
    res.json(gym)
  } catch (err) {
    console.error('Error al actualizar WhatsApp del gym:', err)
    res.status(500).json({ error: err.message })
  }
}

export async function handleSoftDeleteGym(req, res) {
  try {
    const { id } = req.params
    const gym = await softDeleteGym(id)
    res.json(gym)
  } catch (err) {
    console.error('Error al eliminar gimnasio:', err)
    res.status(500).json({ error: err.message })
  }
}

export async function handleListDeletedGyms(req, res) {
  try {
    const gyms = await listDeletedGyms()
    res.json(gyms)
  } catch (err) {
    console.error('Error al listar gimnasios eliminados:', err)
    res.status(500).json({ error: err.message })
  }
}

export async function handleRestoreGym(req, res) {
  try {
    const { id } = req.params
    const gym = await restoreGym(id)
    res.json(gym)
  } catch (err) {
    console.error('Error al restaurar gimnasio:', err)
    res.status(500).json({ error: err.message })
  }
}

export async function handleGetWhatsappQR(req, res) {
  try {
    const { id } = req.params
    const { data: gym, error } = await supabaseAdmin
      .from('gyms')
      .select('name')
      .eq('id', id)
      .single()

    if (error || !gym) return res.status(404).json({ error: 'Gimnasio no encontrado' })
    if (!process.env.EVOLUTION_API_URL || !process.env.EVOLUTION_API_KEY)
      return res.status(500).json({ error: 'Evolution API no configurada en el servidor' })

    const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY
    const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL
    const instanceName = gym.name.toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    // Crear instancia si no existe (qrcode: true → Baileys emite QR inmediatamente)
    const createRes = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_API_KEY },
      body: JSON.stringify({ instanceName, qrcode: true, integration: 'WHATSAPP-BAILEYS' })
    })
    const createCT = createRes.headers.get('content-type') ?? ''
    const createData = createCT.includes('application/json') ? await createRes.json() : null

    // Si el create ya trajo el QR (instancia nueva), usarlo directamente
    let base64 = createData?.qrcode?.base64 ?? createData?.base64 ?? null
    let pairingCode = createData?.qrcode?.pairingCode ?? createData?.pairingCode ?? null
    let state = createData?.instance?.state ?? null

    // Si no vino en el create (instancia ya existía), pedir /instance/connect
    if (!base64 && !pairingCode) {
      const qrRes = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
        headers: { apikey: EVOLUTION_API_KEY }
      })
      const qrCT = qrRes.headers.get('content-type') ?? ''
      if (!qrCT.includes('application/json')) {
        return res.status(503).json({ error: 'Evolution API está iniciando, reintentá en unos segundos' })
      }
      const qrData = await qrRes.json()
      if (qrData.error) return res.status(500).json({ error: 'No se pudo generar el QR' })
      base64 = qrData.qrcode?.base64 ?? qrData.base64 ?? null
      pairingCode = qrData.qrcode?.pairingCode ?? qrData.pairingCode ?? null
      state = qrData.instance?.state ?? state
    }

    res.json({
      qr_base64: base64,
      pairing_code: pairingCode,
      status: state ?? 'connecting'
    })
  } catch (err) {
    console.error('Error al obtener QR de WhatsApp:', err)
    res.status(500).json({ error: err.message })
  }
}

export async function handleGetWhatsappStatus(req, res) {
  try {
    const { id } = req.params
    const { data: gym, error } = await supabaseAdmin
      .from('gyms')
      .select('name')
      .eq('id', id)
      .single()

    if (error || !gym) return res.status(404).json({ error: 'Gimnasio no encontrado' })
    if (!process.env.EVOLUTION_API_URL || !process.env.EVOLUTION_API_KEY)
      return res.json({ status: 'unconfigured' })

    const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY
    const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL
    const instanceName = gym.name.toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    const stateRes = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
      headers: { apikey: EVOLUTION_API_KEY }
    })

    if (!stateRes.ok) return res.json({ status: 'disconnected' })

    const stateCT = stateRes.headers.get('content-type') ?? ''
    if (!stateCT.includes('application/json')) return res.json({ status: 'disconnected' })

    const stateData = await stateRes.json()
    const state = stateData.instance?.state ?? stateData.state ?? 'disconnected'

    res.json({ status: state === 'open' ? 'connected' : 'disconnected' })
  } catch (err) {
    console.error('Error al obtener estado de WhatsApp:', err)
    res.json({ status: 'disconnected' })
  }
}

export async function handleTriggerWhatsappCron(req, res) {
  try {
    const roleId = Number(req.user?.user_metadata?.role_id)
    if (roleId !== 1) return res.status(403).json({ error: 'Solo el owner puede disparar este proceso' })
    res.json({ message: 'Envío iniciado en background' })
    enviarRecordatoriosWhatsApp().catch(err =>
      console.error('[WA CRON manual] Error:', err)
    )
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const handleUpdateGym = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    if (!id) {
      return res.status(400).json({ error: 'ID de gimnasio requerido' })
    }

    const gym = await updateGym(id, updates)
    res.json(gym)
  } catch (err) {
    console.error('Error al actualizar gimnasio:', err)
    res.status(500).json({ error: err.message })
  }
}
