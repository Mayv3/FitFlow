'use client'

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import axios from 'axios'
import Cookies from 'js-cookie'
import { Turno } from '@/models/appointments/Appointment'

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
      const token = Cookies.get('token')
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/turnos`,
        {
          params: { gymId, page, pageSize, q },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      )
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
      const token = Cookies.get('token')
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/turnos`,
        { ...values, gym_id: gymId },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      )
      return data as Turno
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments", gymId] })
    },
  })
}

export const useEditAppointment = (gymId: string) => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: EditArgs) => {
      const token = Cookies.get('token')
      const { data } = await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/turnos/${id}`,
        values,
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      )
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
      const token = Cookies.get('token')
      await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/turnos/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments", gymId] })
    },
  })
}

