import axios from 'axios'
import Cookies from 'js-cookie'
import { refreshAccessToken } from '@/lib/auth/tokenRefresh'
import { aplicarSede } from '@/lib/auth/sedeSession'
import { Gym } from '@/models/Gym/Gym'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
})

api.interceptors.request.use((config) => {
  const token = Cookies.get('token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// El access_token vence (lo renovamos antes en UserContext, pero esto cubre
// el caso de que igual llegue vencido: laptop dormida, reloj desincronizado, etc.).
// Reintenta la request una sola vez con un token nuevo antes de rendirse.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error
    const isExpiredToken =
      response?.status === 401 ||
      (response?.status === 403 && response?.data?.error === 'Token inválido o expirado')

    if (!isExpiredToken || config._retriedAfterRefresh) {
      return Promise.reject(error)
    }
    config._retriedAfterRefresh = true

    const newToken = await refreshAccessToken()
    if (!newToken) {
      return Promise.reject(error)
    }

    if (response?.data?.code === 'SEDE_CAMBIADA') {
      try {
        const { data } = await axios.get<{ active_gym_id: string | null; sedes: Gym[] }>(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/sedes`,
          { headers: { Authorization: `Bearer ${newToken}` } }
        )
        const sede = data.sedes.find((item) => item.id === data.active_gym_id)
        if (sede) aplicarSede(sede)
      } catch {
        // El siguiente pedido volverá a intentar sincronizar la sede.
      }
      return Promise.reject(error)
    }

    config.headers.Authorization = `Bearer ${newToken}`
    return api(config)
  }
)
