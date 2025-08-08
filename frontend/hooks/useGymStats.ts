import { useQuery } from '@tanstack/react-query'
import Cookies from 'js-cookie'
import axios from 'axios'

export function useGymStats(gymId?: string) {
  return useQuery({
    queryKey: ['stats', gymId ?? 'all'],
    queryFn: async () => {
      const token = Cookies.get('token')
      if (!token) throw new Error('No autorizado')

      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stats`,
        {
          params: gymId ? { gymId } : {},
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      return data as {
        totalMembers: number
        activeMembers: number
        todaysAttendance: number
        withPlanPct: number
      }
    },
    staleTime: 60 * 1000,
  })
}
