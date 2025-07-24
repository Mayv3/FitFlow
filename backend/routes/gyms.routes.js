import express from 'express'
import { handleCreateGym, handleListGyms } from '../controllers/gyms.controller.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

router.post('/', verifyToken, handleCreateGym)
router.get('/', handleListGyms)

export default router