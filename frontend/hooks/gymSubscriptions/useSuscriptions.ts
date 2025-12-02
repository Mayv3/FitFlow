import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import Cookies from 'js-cookie'
import { notify } from '@/lib/toast'

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL

interface GymPlan {
  id: number
  name: string
  max_alumnos: number
  stats: boolean
  classes: boolean
  services: boolean
  appointments: boolean
  portal: boolean
  settings: boolean
}

export interface Suscription {
  id: number
  gym_id: string
  plan_id: number
  is_active: boolean
  start_at: string
  end_at: string | null
  created_at: string
  updated_at: string
  gym_plans: GymPlan | null
}

interface CreateSuscriptionData {
  gym_id: string
  plan_id: number
  is_active?: boolean
  start_at?: string
  end_at?: string | null
}

interface UpdateSuscriptionData {
  plan_id?: number
  is_active?: boolean
  start_at?: string
  end_at?: string | null
}

const getAuthHeaders = () => {
  const token = Cookies.get('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Fetch todas las suscripciones
export const useSuscriptions = () => {
  return useQuery({
    queryKey: ['suscriptions'],
    queryFn: async () => {
      const { data } = await axios.get<Suscription[]>(
        `${API_URL}/api/suscriptions`,
        { headers: getAuthHeaders() }
      )
      return data || []
    },
  })
}

// Fetch suscripciones de un gimnasio
export const useSuscriptionsByGymId = (gymId: string | undefined, onlyActive = false) => {
  return useQuery({
    queryKey: ['suscriptions', 'gym', gymId, onlyActive],
    queryFn: async () => {
      const { data } = await axios.get<Suscription[]>(
        `${API_URL}/api/suscriptions/gym/${gymId}${onlyActive ? '?active=true' : ''}`,
        { headers: getAuthHeaders() }
      )
      return data || []
    },
    enabled: !!gymId,
  })
}

// Fetch suscripción activa de un gimnasio
export const useActiveSuscriptionByGymId = (gymId: string | undefined) => {
  return useQuery({
    queryKey: ['suscriptions', 'gym', gymId, 'active'],
    queryFn: async () => {
      const { data } = await axios.get<Suscription | null>(
        `${API_URL}/api/suscriptions/gym/${gymId}/active`,
        { headers: getAuthHeaders() }
      )
      return data
    },
    enabled: !!gymId,
  })
}

// Crear suscripción
export const useCreateSuscription = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (suscriptionData: CreateSuscriptionData) => {
      const { data } = await axios.post<Suscription>(
        `${API_URL}/api/suscriptions`,
        suscriptionData,
        { headers: getAuthHeaders() }
      )
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['suscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['suscriptions', 'gym', data.gym_id] })
      notify.success('Suscripción creada exitosamente')
    },
    onError: (error: any) => {
      notify.error(error.response?.data?.error || 'Error al crear la suscripción')
    },
  })
}

// Actualizar suscripción
export const useUpdateSuscription = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...suscriptionData }: UpdateSuscriptionData & { id: number }) => {
      const { data } = await axios.put<Suscription>(
        `${API_URL}/api/suscriptions/${id}`,
        suscriptionData,
        { headers: getAuthHeaders() }
      )
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['suscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['suscriptions', 'gym', data.gym_id] })
      notify.success('Suscripción actualizada exitosamente')
    },
    onError: (error: any) => {
      notify.error(error.response?.data?.error || 'Error al actualizar la suscripción')
    },
  })
}

// Eliminar suscripción
export const useDeleteSuscription = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, gymId }: { id: number; gymId: string }) => {
      await axios.delete(
        `${API_URL}/api/suscriptions/${id}`,
        { headers: getAuthHeaders() }
      )
      return { gymId }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['suscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['suscriptions', 'gym', variables.gymId] })
      notify.success('Suscripción eliminada exitosamente')
    },
    onError: (error: any) => {
      notify.error(error.response?.data?.error || 'Error al eliminar la suscripción')
    },
  })
}
