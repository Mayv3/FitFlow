import { supabaseAdmin } from '../db/supabaseClient.js'
import { createGym, listGyms, updateGym } from '../services/gyms.supabase.js'

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
