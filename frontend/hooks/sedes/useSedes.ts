'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Cookies from 'js-cookie'
import { api } from '@/lib/api'
import { refreshAccessToken } from '@/lib/auth/tokenRefresh'
import { aplicarSede, SEDE_STORAGE_KEY } from '@/lib/auth/sedeSession'
import { Gym } from '@/models/Gym/Gym'

type SedesResponse = { active_gym_id: string | null; sedes: Gym[] }

const SIN_SEDES: Gym[] = []

/** Pide un token con la sede nueva (el gym_id viaja en el JWT) y la aplica. */
async function renovarYAplicar(sede: Gym) {
  const token = await refreshAccessToken()
  if (!token) throw new Error('No se pudo renovar la sesión')
  aplicarSede(sede)
}

export const useSedes = () => {
  const [cambiandoA, setCambiandoA] = useState<string | null>(null)

  useEffect(() => {
    const recargarOtraPestana = (event: StorageEvent) => {
      if (event.key === SEDE_STORAGE_KEY) window.location.reload()
    }
    window.addEventListener('storage', recargarOtraPestana)
    return () => window.removeEventListener('storage', recargarOtraPestana)
  }, [])

  const { data } = useQuery<SedesResponse>({
    queryKey: ['sedes'],
    queryFn: async () => (await api.get('/api/auth/sedes')).data,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  })

  const sedes = data?.sedes ?? SIN_SEDES
  const activeId = data?.active_gym_id ?? null

  // Si la sede se cambió desde otro dispositivo o pestaña, esta quedó mostrando
  // la anterior: se pone al día sola en vez de seguir cargando datos en la otra.
  useEffect(() => {
    const local = Cookies.get('gym_id')
    if (!activeId || !local || activeId === local) return
    const sede = sedes.find((s) => s.id === activeId)
    if (sede) renovarYAplicar(sede).catch(() => {})
  }, [activeId, sedes])

  const cambiar = async (gymId: string) => {
    setCambiandoA(gymId)
    try {
      const { data: res } = await api.post<{ sede: Gym }>('/api/auth/sedes/cambiar', { gym_id: gymId })
      await renovarYAplicar(res.sede)
    } catch (e) {
      setCambiandoA(null)
      throw e
    }
  }

  return { sedes, activeId, cambiandoA, cambiar }
}
