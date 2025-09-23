import { registerUser, loginUser, logoutUser, forgotPasswordService, resetPasswordService } from '../services/auth.supabase.js'

export async function handleRegisterUser(req, res) {
  try {
    const { email, password, dni, gym_id, role_id, name } = req.body

    if (!email || !password || !dni || !gym_id || !role_id || !name) {
      return res.status(400).json({ error: "Faltan campos requeridos" })
    }

    const user = await registerUser({ email, password, dni, gym_id, role_id, name })

    return res.status(201).json({ message: "Usuario registrado", user })
  } catch (err) {
    console.error("Error al registrar usuario:", err)

    let mensaje = "Ocurrió un error en la autenticación"

    if (err.message.includes("User already registered")) {
      mensaje = "El usuario ya está registrado"
    } else if (err.message.includes("A user with this email address has already been registered")) {
      mensaje = "Ya existe un usuario registrado con este correo electrónico"
    } else if (err.message.includes("Invalid login credentials")) {
      mensaje = "Credenciales inválidas"
    } else if (err.message.includes("Email not confirmed")) {
      mensaje = "El correo electrónico no fue confirmado"
    } else if (err.message.includes("Invalid email")) {
      mensaje = "El correo electrónico no es válido"
    } else if (err.message.includes("Password should be at least 6 characters")) {
      mensaje = "La contraseña debe tener al menos 6 caracteres"
    } else if (err.message.includes("Token expired")) {
      mensaje = "El token ha expirado"
    } else if (err.message.includes("Refresh Token Not Found")) {
      mensaje = "No se encontró el token de sesión"
    } else if (err.message.includes("Email rate limit exceeded")) {
      mensaje = "Se superó el límite de envíos de correo electrónico. Intenta más tarde."
    }

    return res.status(400).json({ error: mensaje })
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

    return res.json({ success: true, message: "Contraseña actualizada correctamente" })
  } catch (err) {
    console.error("Controller error:", err)
    return res.status(500).json({ error: "Error interno del servidor" })
  }
}
