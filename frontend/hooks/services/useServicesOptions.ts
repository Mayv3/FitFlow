'use client'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import Cookies from 'js-cookie'

export const servicesKey = (gymId: string) => ['services', gymId] as const

export const useServicesByGym = (gymId?: string) => {
  return useQuery({
    queryKey: servicesKey(gymId!),
    enabled: !!gymId,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<{ items: any[]; options: { label: string; value: number }[] }> => {
      const token = Cookies.get('token')
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/servicios`,
        {
          params: { gym_id: gymId },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      )

      const items = Array.isArray(data?.items) ? data.items : data ?? []
      const options = items.map((s: any) => ({
        label: s.nombre,
        value: String(s.id),
      }))
      return { items, options }
    },
    select: (res) => ({
      ...res,
      options: res.options,
      byId: res.items.reduce<Record<string, any>>((acc, s) => {
        acc[s.id] = s
        return acc
      }, {}),
    }),
  })
}
