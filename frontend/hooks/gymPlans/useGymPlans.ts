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
  created_at: string
  updated_at: string
}

interface CreatePlanData {
  name: string
  max_alumnos: number
  stats: boolean
  classes: boolean
  services: boolean
  appointments: boolean
  portal: boolean
  settings: boolean
}

interface UpdatePlanData {
  name?: string
  max_alumnos?: number
  stats?: boolean
  classes?: boolean
  services?: boolean
  appointments?: boolean
  portal?: boolean
  settings?: boolean
}

const getAuthHeaders = () => {
  const token = Cookies.get('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Fetch todos los gym plans
export const useGymPlans = () => {
  return useQuery({
    queryKey: ['gymPlans'],
    queryFn: async () => {
      const { data } = await axios.get<GymPlan[]>(
        `${API_URL}/api/gym-plans`,
        { headers: getAuthHeaders() }
      )
      return data || []
    },
  })
}

// Crear gym plan
export const useCreateGymPlan = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (planData: CreatePlanData) => {
      const { data } = await axios.post<GymPlan>(
        `${API_URL}/api/gym-plans`,
        planData,
        { headers: getAuthHeaders() }
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gymPlans'] })
      notify.success('Plan creado exitosamente')
    },
    onError: (error: any) => {
      notify.error(error.response?.data?.error || 'Error al crear el plan')
    },
  })
}

// Actualizar gym plan
export const useUpdateGymPlan = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...planData }: UpdatePlanData & { id: number }) => {
      const { data } = await axios.put<GymPlan>(
        `${API_URL}/api/gym-plans/${id}`,
        planData,
        { headers: getAuthHeaders() }
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gymPlans'] })
      notify.success('Plan actualizado exitosamente')
    },
    onError: (error: any) => {
      notify.error(error.response?.data?.error || 'Error al actualizar el plan')
    },
  })
}

// Eliminar gym plan
export const useDeleteGymPlan = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(
        `${API_URL}/api/gym-plans/${id}`,
        { headers: getAuthHeaders() }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gymPlans'] })
      notify.success('Plan eliminado exitosamente')
    },
    onError: (error: any) => {
      notify.error(error.response?.data?.error || 'Error al eliminar el plan')
    },
  })
}
