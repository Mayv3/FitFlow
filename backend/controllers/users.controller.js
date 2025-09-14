import { listUsers } from "../services/users.supabase.js"

export async function handleListUsers(req, res) {
  try {
    const gymId = req.query.gym_id || null
    const users = await listUsers(gymId)
    return res.status(200).json(users)
  } catch (err) {
    console.error("Error al listar usuarios:", err)
    return res.status(500).json({ error: err.message })
  }
}
