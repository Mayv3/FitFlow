
import { supabaseAdmin } from "../config/supabaseClient.js"

// La firma ya la validó getUser; acá solo se lee el claim.
function gymIdDelToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())
    return payload.app_metadata?.gym_id ?? null
  } catch {
    return null
  }
}

export async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || ''
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' })
  }
  const token = authHeader.split(' ')[1]

  const {
    data: { user },
    error
  } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) {
    return res.status(403).json({ error: 'Token inválido o expirado' })
  }

  // getUser devuelve el app_metadata actual, pero el RLS lee el gym_id del JWT.
  // Si el usuario cambió de sede desde otro dispositivo, este token quedó con la
  // sede vieja: se rechaza con 401 para que el cliente lo renueve, en vez de
  // dejar que req.gymId y el RLS apunten a sedes distintas.
  const gymActual = user.app_metadata?.gym_id
  if (gymActual && gymIdDelToken(token) !== gymActual) {
    return res.status(401).json({ error: 'Cambiaste de sede. Actualizando la sesión…', code: 'SEDE_CAMBIADA' })
  }

  req.user = user
  req.gymId = user.app_metadata?.gym_id
  next()
}
