import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { notify } from '@/lib/toast'

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

// Fetch todos los gym plans
export const useGymPlans = () => {
  return useQuery({
    queryKey: ['gymPlans'],
    queryFn: async () => {
      const { data } = await api.get<GymPlan[]>('/api/gym-plans')
      return data || []
    },
  })
}

// Crear gym plan
export const useCreateGymPlan = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (planData: CreatePlanData) => {
      const { data } = await api.post<GymPlan>('/api/gym-plans', planData)
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
      const { data } = await api.put<GymPlan>(`/api/gym-plans/${id}`, planData)
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
      await api.delete(`/api/gym-plans/${id}`)
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
