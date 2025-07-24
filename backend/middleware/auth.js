
import { supabaseAdmin } from "../db/supabaseClient.js"

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

  req.user = user
  next()
}
