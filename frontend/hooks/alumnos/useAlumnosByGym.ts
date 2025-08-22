import { useQuery } from '@tanstack/react-query'
import Cookies from 'js-cookie'
import axios from 'axios'

export function useAlumnosByGym(
  gymId: string,
  page = 1,
  limit = 20
) {
  return useQuery({
    queryKey: ['members', gymId, page, limit],
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

export const useAlumnosSimpleByGym = (gymId?: string) => {
  return useQuery({
    queryKey: ['alumnos-simple', gymId],
    enabled: !!gymId,
    queryFn: async () => {
      const token = Cookies.get('token')
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumnos/simple`,
        {
          params: { gym_id: gymId },
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return data
    }
  })
}