import { Router } from 'express'
import {
  listRoles,
  getRole,
  addRole,
  editRole,
  removeRole
} from '../controllers/roles.controller.js'

const router = Router()
router.get('/', listRoles)
router.get('/:id', getRole)
router.post('/', addRole)
router.put('/:id', editRole)
router.delete('/:id', removeRole)

export default router
