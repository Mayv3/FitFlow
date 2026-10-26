import { createHash } from 'node:crypto'
import { LRUCache } from 'lru-cache'
import { supabaseAdmin } from '../config/supabaseClient.js'

// `getUser()` es la validacion recomendada por Supabase para proyectos que
// usan claves JWT compartidas (HS256), pero una pantalla puede disparar muchas
// requests protegidas al mismo tiempo. Conservamos la validacion remota y
// reutilizamos exclusivamente un resultado ya validado por un lapso corto.
const AUTH_CACHE_TTL_MS = 30_000

function tokenCacheKey(token) {
  // No guardar el access token en texto plano en la cache del proceso.
  return createHash('sha256').update(token).digest('base64url')
}

function tokenExpiryMs(token) {
  try {
    const payload = token.split('.')[1]
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return Number.isFinite(exp) ? exp * 1000 : null
  } catch {
    return null
  }
}

/**
 * Factory exportada para probar la autenticacion sin hacer requests reales.
 * La cache corta se limita tambien por `exp`, por lo que nunca acepta un JWT
 * vencido solo porque habia quedado una entrada en memoria.
 */
export function createVerifyToken({ getUser, cache = new LRUCache({ max: 10_000 }) }) {
  const pendingValidations = new Map()

  return async function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization || ''
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' })
    }
    const token = authHeader.split(' ')[1]
    const key = tokenCacheKey(token)
    let user = cache.get(key)

    if (!user) {
      let validation = pendingValidations.get(key)
      if (!validation) {
        validation = getUser(token)
        pendingValidations.set(key, validation)
      }

      let result
      try {
        result = await validation
      } finally {
        pendingValidations.delete(key)
      }

      const error = result?.error
      user = result?.data?.user
      if (error || !user) {
        return res.status(403).json({ error: 'Token inválido o expirado' })
      }

      const expiry = tokenExpiryMs(token)
      const ttl = expiry === null ? 0 : Math.min(AUTH_CACHE_TTL_MS, expiry - Date.now())
      if (ttl > 0) cache.set(key, user, { ttl })
    }

    req.user = user
    req.gymId = user.app_metadata?.gym_id
    next()
  }
}

export const verifyToken = createVerifyToken({
  getUser: (token) => supabaseAdmin.auth.getUser(token),
})
