import express from 'express'
import { handleRegisterUser,handleLoginUser , handleLogoutUser, handleForgotPassword, handleResetPassword } from '../controllers/auth.controller.js'

const router = express.Router()

router.post('/register', handleRegisterUser)
router.post('/login', handleLoginUser)
router.post('/logout', handleLogoutUser)
router.post("/forgot-password", handleForgotPassword)
router.post("/reset-password", handleResetPassword)

export default router