import { useQuery } from '@tanstack/react-query'
import Cookies from 'js-cookie'
import axios from 'axios'

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
    },
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 5,         
  })
}