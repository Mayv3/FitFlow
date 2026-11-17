import { listUsers, changePasswordService, updateUserRole, deleteUser } from "../services/users.supabase.js"
import { isOwner } from "../middleware/requireRole.js"

// El owner opera sobre cualquier gym (null = sin filtro); el resto, solo sobre el de su token.
const gymPermitido = (req) => (isOwner(req) ? null : req.gymId)

const noEncontrado = (err) => err?.code === "PGRST116"

export async function handleListUsers(req, res) {
  try {
    const gymId = isOwner(req) ? req.query.gym_id || req.gymId : req.gymId
    if (!gymId && !isOwner(req)) return res.status(403).json({ error: "Acceso denegado" })

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

const VALID_ROLE_IDS = [1, 2, 3]

export async function handleUpdateUserRole(req, res) {
  try {
    const { id } = req.params
    const { role_id } = req.body
    if (!id || !role_id) return res.status(400).json({ error: "Faltan datos" })
    if (!VALID_ROLE_IDS.includes(Number(role_id))) return res.status(400).json({ error: "Rol inválido" })
    if (Number(role_id) === 1 && !isOwner(req)) return res.status(403).json({ error: "No podés asignar el rol owner" })

    const updated = await updateUserRole(id, role_id, gymPermitido(req))
    res.json({ message: "Rol actualizado correctamente", user: updated })
  } catch (err) {
    if (noEncontrado(err)) return res.status(404).json({ error: "Usuario no encontrado" })
    console.error("Error al actualizar rol:", err)
    res.status(500).json({ error: "No se pudo actualizar el rol" })
  }
}

export async function handleDeleteUser(req, res) {
  try {
    const { id } = req.params
    if (!id) return res.status(400).json({ error: "El id es requerido" })

    const deleted = await deleteUser(id, gymPermitido(req))
    res.json({ message: "Usuario eliminado correctamente", deleted })
  } catch (err) {
    if (noEncontrado(err)) return res.status(404).json({ error: "Usuario no encontrado" })
    console.error("Error al eliminar usuario:", err)
    res.status(500).json({ error: "No se pudo eliminar el usuario" })
  }
}