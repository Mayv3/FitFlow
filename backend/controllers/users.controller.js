import { listUsers, changePasswordService } from "../services/users.supabase.js"

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

export const handleChangePassword = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ error: "Faltan datos" })
    }

    const result = await changePasswordService(email, currentPassword, newPassword)

    if (!result.success) {
      return res.status(result.status).json({ error: result.error })
    }

    return res.json({ success: true })
  } catch (err) {
    console.error("Controller error:", err)
    return res.status(500).json({ error: "Error interno del servidor" })
  }
}