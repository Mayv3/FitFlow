'use client'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Clase } from '@/models/Clase/Clase'

const clasesKey = (gymId: string) => ['clases', gymId] as const

export const useClases = (
  gymId?: string,
  page = 1,
  pageSize = 20,
  q = ''
) => {
  const query = useQuery({
    queryKey: ['clases', gymId, page, pageSize, q],
    enabled: !!gymId,
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<{ items: Clase[]; total: number }> => {
      const { data } = await api.get(
        '/api/clases',
        { params: { gymId, page, pageSize, q } }
      )
      return data
    },
    select: (res) => {
      const rows = res.items ?? res
      const options = rows.map(c => ({
        label: `${c.nombre} — Cap: ${c.capacidad_default}`,
        value: c.id,
      }))
      const byId = rows.reduce<Record<string, Clase>>((acc, c) => {
        acc[String(c.id)] = c
        return acc
      }, {})
      return { rows, options, byId, total: res.total ?? rows.length }
    },
  })

  return {
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    options: query.data?.options ?? [],
    byId: query.data?.byId ?? {},
    rows: query.data?.rows ?? [],
    total: query.data?.total ?? 0,
    error: query.error,
  }
}

export const useAddClase = (gymId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: any) => {
      const { data } = await api.post(
        '/api/clases',
        { ...values, gym_id: gymId }
      )
      return data as Clase
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clasesKey(gymId) })
    },
  })
}

export const useEditClase = (gymId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: number; values: any }) => {
      const { data } = await api.put(
        `/api/clases/${id}`,
        values
      )
      return data as Clase
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clasesKey(gymId) })
    },
  })
}

export const useDeleteClase = (gymId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(
        `/api/clases/${id}`
      )
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clasesKey(gymId) })
    },
  })
}

export const useClasesSimple = (gymId?: string) => {
  return useQuery({
    queryKey: ['clases-simple', gymId],
    enabled: !!gymId,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<Clase[]> => {
      const { data } = await api.get(
        '/api/clases/simple',
        { params: { gymId } }
      )
      return data
    },
  })
}
