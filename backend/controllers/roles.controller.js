import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole
} from '../services/roles.supabase.js'

export const listRoles = async (_req, res) => {
  try {
    const roles = await getAllRoles()
    res.json(roles)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getRole = async (req, res) => {
  try {
    const role = await getRoleById(req.params.id)
    res.json(role)
  } catch (error) {
    res.status(404).json({ error: error.message })
  }
}

export const addRole = async (req, res) => {
  try {
    const nuevo = await createRole(req.body)
    res.status(201).json(nuevo)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

export const editRole = async (req, res) => {
  try {
    const actualizado = await updateRole(req.params.id, req.body)
    res.json(actualizado)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

export const removeRole = async (req, res) => {
  try {
    await deleteRole(req.params.id)
    res.sendStatus(204)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
