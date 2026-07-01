import express from 'express'
import { handleCreateGym, handleListGyms, handleGetGym, handleUpdateGymSettings, handleSoftDeleteGym, handleListDeletedGyms, handleRestoreGym, handleUpdateGym } from '../controllers/gyms.controller.js'
import { verifyToken } from '../middleware/auth.js'
import { requireRole } from '../middleware/requireRole.js'
import { getGymOverview } from '../services/gyms.supabase.js'

const router = express.Router()

// role 1 = OWNER (operador SaaS): único que gestiona el alta/baja/edición de gimnasios
router.post('/', verifyToken, requireRole(1), handleCreateGym)
router.get('/', handleListGyms)
router.get('/deleted', verifyToken, requireRole(1), handleListDeletedGyms)
router.get("/:id", handleGetGym)
router.put("/settings", verifyToken, handleUpdateGymSettings)
router.put('/:id', verifyToken, requireRole(1), handleUpdateGym)
router.patch('/:id/delete', verifyToken, requireRole(1), handleSoftDeleteGym)
router.patch('/:id/restore', verifyToken, requireRole(1), handleRestoreGym)
router.get("/owner/gyms/:gym_id/overview", getGymOverview)
export default router