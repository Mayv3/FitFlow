import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

/**
 * Alumnos para los selects (pagos, turnos). Sin cache: `staleTime: 0` mas
 * `refetchOnMount: 'always'` para que al entrar a Pagos despues de crear un
 * alumno el select ya lo traiga. `placeholderData` solo evita el parpadeo:
 * pinta la lista anterior mientras revalida.
 */
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
    staleTime: 0,
    refetchOnMount: 'always',
  })
}
