import { useQuery } from '@tanstack/react-query'
import Cookies from 'js-cookie'
import axios from 'axios'

export function useAlumnosByGym(
  gymId: string,
  page = 1,
  limit = 20
) {
  return useQuery({
    queryKey: ['alumnos', gymId, page, limit],
    queryFn: async () => {

      const token = Cookies.get('token')
      if (!token) {
        return Promise.reject(new Error('No autorizado'))
      }

      return axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumnos`,
        {
          params: { gym_id: gymId, page, limit },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then(res => res.data)
    },
    enabled: Boolean(gymId),
    staleTime: 60 * 60_000,
    retry: 1,
  })
}