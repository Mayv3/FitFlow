'use client'

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import axios from 'axios'
import Cookies from 'js-cookie'
import { Turno } from '@/models/appointments/Appointment'

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  withCredentials: true,
})

axiosInstance.interceptors.request.use((config) => {
  const token = Cookies.get('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const appointmentsKey = (gymId: string, page?: number, pageSize?: number, q?: string) =>
  ['appointments', gymId, page, pageSize, q] as const

type EditArgs = {
  id: string
  values: any
  skipInvalidate?: boolean
}

export const useAppointments = (gymId?: string, page = 1, pageSize = 20, q = '') => {
  return useQuery({
    queryKey: appointmentsKey(gymId!, page, pageSize, q),
    enabled: !!gymId,
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<{ items: any[]; total: number }> => {
      const { data } = await axiosInstance.get('/api/turnos', {
        params: { gymId, page, pageSize, q },
      })
      return data
    },
    select: (res) => {
      const rows = (res.items ?? []).map((t: any) => ({
        id: String(t.id),
        title: t.titulo ?? 'Sin título',
        start: t.inicio_at,
        end: t.fin_at,
        color: t.color?.trim() || '#1976d2',
        extendedProps: {
          gym_id: t.gym_id,
          profesional: t.profesional ?? '—',
          alumno_id: t.alumno_id ?? null,
          servicio_id: t.servicio_id ?? null,
          descripcion: t.descripcion ?? '',
          precio: t.precio ?? 0,
        },
      }))
      const byId = rows.reduce<Record<string, any>>((acc, t) => {
        acc[t.id] = t
        return acc
      }, {})
      return { rows, byId, total: res.total ?? rows.length }
    },
  })
}

export const useAddAppointment = (gymId: string) => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (values: any) => {
      const { data } = await axiosInstance.post('/api/turnos', { ...values, gym_id: gymId })
      return data as Turno
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments', gymId] })
    },
  })
}

export const useEditAppointment = (gymId: string) => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: EditArgs) => {
      const { data } = await axiosInstance.put(`/api/turnos/${id}`, values)
      return data
    },
    onSuccess: (_data, variables) => {
      if (!variables?.skipInvalidate) {
        qc.invalidateQueries({ queryKey: ['appointments', gymId] })
      }
    },
  })
}

export const useDeleteAppointment = (gymId: string) => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/api/turnos/${id}`)
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments', gymId] })
    },
  })
}
