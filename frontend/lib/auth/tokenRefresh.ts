import axios from 'axios'
import Cookies from 'js-cookie'

type Session = {
  access_token: string
  refresh_token: string
}

const REFRESH_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/refresh`

// Evita disparar varios refresh en paralelo (varios requests que vencen a la vez).
let pendingRefresh: Promise<string | null> | null = null

/** Decodifica el claim `exp` (epoch en segundos) de un JWT sin validar la firma. */
export function getJwtExpiryMs(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const { exp } = JSON.parse(json)
    return typeof exp === 'number' ? exp * 1000 : null
  } catch {
    return null
  }
}

function persistSession(session: Session) {
  Cookies.set('token', session.access_token)
  Cookies.set('refresh_token', session.refresh_token)
}

function clearSession() {
  Cookies.remove('token')
  Cookies.remove('refresh_token')
}

/**
 * Pide un access_token nuevo con el refresh_token guardado. Devuelve el token
 * nuevo o null si no se pudo renovar (sesión vencida de verdad -> hay que
 * volver a loguearse). Las llamadas concurrentes comparten el mismo pedido.
 */
export function refreshAccessToken(): Promise<string | null> {
  if (pendingRefresh) return pendingRefresh

  pendingRefresh = (async () => {
    const refresh_token = Cookies.get('refresh_token')
    if (!refresh_token) return null

    try {
      const { data } = await axios.post(REFRESH_URL, { refresh_token })
      persistSession(data.session)
      return data.session.access_token as string
    } catch {
      clearSession()
      return null
    } finally {
      pendingRefresh = null
    }
  })()

  return pendingRefresh
}
