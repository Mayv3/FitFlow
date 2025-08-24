'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Plan } from '@/models/Plan/Plan'

const planesKey = (gymId: string) => ['planes-precios', gymId] as const

export const usePlanesPrecios = (gymId?: string) => {
  const query = useQuery({
    queryKey: planesKey(gymId!),
    enabled: !!gymId,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<Plan[]> => {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/planes`,
        { params: { gymId } }
      )
      return data
    },
    select: (rows: Plan[]) => {
      const options = rows.map(p => ({
        label: `${p.nombre} — ${p.numero_clases} clases ($${p.precio})`,
        value: p.id, // número
      }))
      const byId = rows.reduce<Record<string, Plan>>((acc, p) => {
        acc[String(p.id)] = p
        return acc
      }, {})
      return { rows, options, byId }
    },
  })

  return {
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    options: query.data?.options ?? [],
    byId: query.data?.byId ?? {},
    rows: query.data?.rows ?? [],
    error: query.error,
  }
}

export const useAddPlan = (gymId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: any) => {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/planes`,
        { ...values, gym_id: gymId }
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
      const { data } = await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/planes/${id}`,
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
      await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/planes/${id}`)
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
