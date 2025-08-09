import { GymStats } from '@/models/Stats/GymStats';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Cookies from 'js-cookie';

export function useGymStats(gymId?: string) {
  return useQuery({
    queryKey: ['stats', gymId ?? 'all'],
    queryFn: async (): Promise<GymStats> => {
      const token = Cookies.get('token');
      if (!token) throw new Error('No autorizado');

      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stats`,
        {
          params: gymId ? { gymId } : {},
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return data as GymStats;
    },
    staleTime: 60_000,
  });
}