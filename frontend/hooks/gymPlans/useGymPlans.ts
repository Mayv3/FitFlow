import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getApiErrorMessage } from '@/utils/errors/apiError'
import { api } from '@/lib/api'
import { notify } from '@/lib/toast'

/**
 * Feature flags de un plan. `products` faltaba aca aunque ya existe en la tabla:
 * ManageGymPlans la escribe y mailing.brevo lee `gym_plans.products`.
 */
interface GymPlanFeatures {
  stats: boolean
  classes: boolean
  services: boolean
  appointments: boolean
  portal: boolean
  settings: boolean
  products: boolean
}

export interface GymPlan extends GymPlanFeatures {
  id: number
  name: string
  max_alumnos: number
  created_at: string
  updated_at: string
}

interface CreatePlanData extends GymPlanFeatures {
  name: string
  max_alumnos: number
}

type UpdatePlanData = Partial<CreatePlanData>

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
    onError: (error: unknown) => {
      notify.error(getApiErrorMessage(error) || 'Error al crear el plan')
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
    onError: (error: unknown) => {
      notify.error(getApiErrorMessage(error) || 'Error al actualizar el plan')
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
    onError: (error: unknown) => {
      notify.error(getApiErrorMessage(error) || 'Error al eliminar el plan')
    },
  })
}
