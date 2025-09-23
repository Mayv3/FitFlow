import express from 'express'
import { handleCreateGym, handleListGyms, handleGetGym, handleUpdateGymSettings } from '../controllers/gyms.controller.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

router.post('/', verifyToken, handleCreateGym)
router.get('/', handleListGyms)
router.get("/:id", handleGetGym)
router.put("/settings", verifyToken, handleUpdateGymSettings)

export default router