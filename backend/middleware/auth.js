
import { supabaseAdmin } from "../db/supabaseClient.js"
import * as cache from "../utilities/cache.js"

const TOKEN_TTL = 300 // 5 minutos

export async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || ''
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' })
  }
  const token = authHeader.split(' ')[1]

  const cacheKey = `auth:${token.slice(-16)}`
  const t0 = performance.now()

  const cached = await cache.get(cacheKey)
  if (cached) {
    req.user = cached
    req.gymId = cached.user_metadata?.gym_id
    return next()
  }

  const {
    data: { user },
    error
  } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) {
    return res.status(403).json({ error: 'Token inválido o expirado' })
  }

  await cache.set(cacheKey, user, TOKEN_TTL)

  req.user = user
  req.gymId = user.user_metadata?.gym_id
  next()
}
