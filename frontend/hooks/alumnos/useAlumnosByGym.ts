import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export const useAlumnosSimpleByGym = (gymId?: string) => {
  return useQuery({
    queryKey: ['alumnos-simple', gymId],
    enabled: !!gymId,
    queryFn: async () => {
      const { data } = await api.get('/api/alumnos/simple', {
        params: { gym_id: gymId },
      })
      return data
    },
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 5,
  })
}
