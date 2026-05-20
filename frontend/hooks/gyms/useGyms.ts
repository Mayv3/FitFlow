import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Cookies from 'js-cookie'

const API_BASE = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api`

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${Cookies.get('token')}`,
})

export const useDeletedGyms = () =>
  useQuery({
    queryKey: ['gyms', 'deleted'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/gyms/deleted`, { headers: getHeaders() })
      if (!res.ok) throw new Error('Error al obtener gimnasios eliminados')
      return res.json() as Promise<{ id: string; name: string; deleted_at: string }[]>
    },
  })

export const useSoftDeleteGym = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/gyms/${id}/delete`, {
        method: 'PATCH',
        headers: getHeaders(),
      })
      if (!res.ok) throw new Error('Error al eliminar gimnasio')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gyms'] })
    },
  })
}

export interface Gym {
  id: string
  name: string
  logo_url?: string | null
  settings?: any
}

export const useGyms = () =>
  useQuery({
    queryKey: ['gyms', 'list'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/gyms`, { headers: getHeaders() })
      if (!res.ok) throw new Error('Error al obtener gimnasios')
      return res.json() as Promise<Gym[]>
    },
  })

export const useGym = (id?: string, includeSettings = true) =>
  useQuery({
    queryKey: ['gyms', 'detail', id, includeSettings],
    enabled: !!id,
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}/gyms/${id}?include_settings=${includeSettings}`,
        { headers: getHeaders() }
      )
      if (!res.ok) throw new Error('Error al obtener gimnasio')
      return res.json() as Promise<Gym>
    },
  })

export const useCreateGym = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; logo_url?: string | null; settings?: any }) => {
      const res = await fetch(`${API_BASE}/gyms`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || 'Error al crear gimnasio')
      }
      return res.json() as Promise<Gym>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gyms'] }),
  })
}

export const useUpdateGym = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; logo_url?: string | null; settings?: any }) => {
      const res = await fetch(`${API_BASE}/gyms/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || 'Error al actualizar gimnasio')
      }
      return res.json() as Promise<Gym>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gyms'] }),
  })
}

export const useRestoreGym = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/gyms/${id}/restore`, {
        method: 'PATCH',
        headers: getHeaders(),
      })
      if (!res.ok) throw new Error('Error al restaurar gimnasio')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gyms'] })
    },
  })
}
