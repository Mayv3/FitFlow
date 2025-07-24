import express from 'express'
import { handleRegisterUser,handleLoginUser , handleLogoutUser } from '../controllers/auth.controller.js'

const router = express.Router()

router.post('/register', handleRegisterUser)
router.post('/login', handleLoginUser)
router.post('/logout', handleLogoutUser)

export default router