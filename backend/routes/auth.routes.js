import express from 'express'
import rateLimit from 'express-rate-limit'
import { handleRegisterUser,handleLoginUser , handleLogoutUser, handleForgotPassword, handleResetPassword } from '../controllers/auth.controller.js'
import { gymLoginController, getAlumnoInfoController } from '../controllers/gymLogin.controller.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50,
  skipSuccessfulRequests: true, // solo cuenta intentos fallidos
  message: { error: 'Demasiados intentos. Intentá de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
})

router.post('/register', authLimiter, handleRegisterUser)
router.post('/login', authLimiter, handleLoginUser)
router.post('/logout', verifyToken, handleLogoutUser)
router.post("/forgot-password", handleForgotPassword)
router.post("/reset-password", handleResetPassword)
router.post('/gym-login', gymLoginController)
router.get('/gym-alumno/:gym_id/:dni', getAlumnoInfoController)

export default router