import { createGym, listGyms } from '../services/gyms.supabase.js'

/**
 * Controlador para crear un nuevo gimnasio.
 */
export async function handleCreateGym(req, res) {
  try {
    const { name, location } = req.body
    if (!name) {
      return res.status(400).json({ error: 'El nombre del gimnasio es requerido' })
    }
    const gym = await createGym({ name, location })
    res.status(201).json(gym)
  } catch (err) {
    console.error('Error al crear gimnasio:', err)
    res.status(500).json({ error: err.message })
  }
}

/**
 * Controlador para listar gimnasios.
 */
export async function handleListGyms(req, res) {
  try {
    const gyms = await listGyms()
    res.json(gyms)
  } catch (err) {
    console.error('Error al listar gimnasios:', err)
    res.status(500).json({ error: err.message })
  }
}