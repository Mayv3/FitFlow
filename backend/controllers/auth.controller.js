import { registerUser, loginUser, logoutUser, forgotPasswordService, resetPasswordService } from '../services/auth.supabase.js'

export async function handleRegisterUser(req, res) {
  try {
    const { email, password, dni, gym_id, role_id, name } = req.body

    if (!email || !password || !dni || !gym_id || !role_id || !name) {
      return res.status(400).json({ error: 'Faltan campos requeridos' })
    }

    const user = await registerUser({ email, password, dni, gym_id, role_id, name })

    res.status(201).json({ message: 'Usuario registrado', user })
  } catch (err) {
    console.error('Error al registrar usuario:', err)
    res.status(500).json({ error: err.message })
  }
}

export async function handleLoginUser(req, res) {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Faltan email o password' })
    }
    const { session, profile } = await loginUser({ email, password })
    res.json({ session, profile })
  } catch (err) {
    console.error('Error en login:', err)
    res.status(401).json({ error: err.message })
  }
}

export async function handleLogoutUser(req, res) {
  try {
    await logoutUser()
    res.json({ message: 'Sesión cerrada correctamente' })
  } catch (err) {
    console.error('Error en logout:', err)
    res.status(500).json({ error: err.message })
  }
}

export async function handleForgotPassword(req, res) {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: "El email es requerido" })
    }

    const result = await forgotPasswordService(email)

    if (!result.success) {
      return res.status(result.status).json({ error: result.error })
    }

    return res.json({ success: true, message: "Correo de recuperación enviado" })
  } catch (err) {
    console.error("Controller error:", err)
    return res.status(500).json({ error: "Error interno del servidor" })
  }
}

export async function handleResetPassword(req, res) {
  try {
    const { access_token, newPassword } = req.body

    if (!access_token || !newPassword) {
      return res.status(400).json({ error: "Faltan datos" })
    }

    const result = await resetPasswordService(access_token, newPassword)

    if (!result.success) {
      return res.status(result.status).json({ error: result.error })
    }

    return res.json({ success: true, message: "Contraseña actualizada correctamente ✅" })
  } catch (err) {
    console.error("Controller error:", err)
    return res.status(500).json({ error: "Error interno del servidor" })
  }
}