'use client'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { Plan } from '@/models/Plan/Plan'
import { api } from '@/lib/api'

const planesKey = (gymId: string) => ['planes-precios', gymId] as const

export const usePlanesPrecios = (
  gymId?: string,
  page = 1,
  pageSize = 20,
  q = ''
) => {
  const query = useQuery({
    queryKey: ['planes-precios', gymId, page, pageSize, q],
    enabled: !!gymId,
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<{ items: Plan[]; total: number }> => {
      const { data } = await api.get(
        `/api/planes`,
        { params: { page, pageSize, q } }
      )
      return data
    },
    select: (res) => {
      const rows = res.items ?? res
      const options = rows.map(p => ({
        label: `${p.nombre} — ${p.numero_clases} clases ($${p.precio})`,
        value: p.id,
        precio: p.precio,
        numero_clases: p.numero_clases,
      }))
      const byId = rows.reduce<Record<string, Plan>>((acc, p) => {
        acc[String(p.id)] = p
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

export const useAddPlan = (gymId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: any) => {
      const { data } = await api.post(
        `/api/planes`,
        values
      )
      return data as Plan
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: planesKey(gymId) })
    },
  })
}

export const useEditPlan = (gymId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: number; values: any }) => {
      const { data } = await api.put(
        `/api/planes/${id}`,
        values
      )
      return data as Plan
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: planesKey(gymId) })
    },
  })
}

export const useDeletePlan = (gymId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/planes/${id}`)
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: planesKey(gymId) })
    },
  })
}

export const usePlanNameFromCache = () => {
  const qc = useQueryClient()
  return (gymId: string, planId?: string | number | null) => {
    if (!gymId || planId == null) return null
    const planes = qc.getQueryData<{ rows: Plan[] }>(planesKey(gymId))?.rows ?? []
    const p = planes.find((x) => String(x.id) === String(planId))
    return p?.nombre ?? null
  }
}
