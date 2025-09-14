import { registerUser, loginUser, logoutUser } from '../services/auth.supabase.js'

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