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
