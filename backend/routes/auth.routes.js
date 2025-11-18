import express from 'express'
import { handleRegisterUser,handleLoginUser , handleLogoutUser, handleForgotPassword, handleResetPassword } from '../controllers/auth.controller.js'
import { gymLoginController, getAlumnoInfoController } from '../controllers/gymLogin.controller.js'

const router = express.Router()

router.post('/register', handleRegisterUser)
router.post('/login', handleLoginUser)
router.post('/logout', handleLogoutUser)
router.post("/forgot-password", handleForgotPassword)
router.post("/reset-password", handleResetPassword)
router.post('/gym-login', gymLoginController)
router.get('/gym-alumno/:gym_id/:dni', getAlumnoInfoController)

export default router