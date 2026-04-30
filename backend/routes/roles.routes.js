import { Router } from 'express'
import {
  listRoles,
  getRole,
  addRole,
  editRole,
  removeRole
} from '../controllers/roles.controller.js'
import { requireRole } from '../middleware/requireRole.js'

const adminOnly = requireRole(1, 2)

const router = Router()
router.get('/', listRoles)
router.get('/:id', getRole)
router.post('/', adminOnly, addRole)
router.put('/:id', adminOnly, editRole)
router.delete('/:id', adminOnly, removeRole)

export default router
