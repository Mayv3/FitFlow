import { supabaseAdmin } from '../db/supabaseClient.js'
import { createGym, listGyms } from '../services/gyms.supabase.js'

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