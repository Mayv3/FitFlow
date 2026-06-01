import { GymStats } from '@/models/Stats/GymStats';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useGymStats(gymId?: string) {
  return useQuery({
    queryKey: ['stats', gymId ?? 'all'],
    queryFn: async (): Promise<GymStats> => {
      const { data } = await api.get('/api/stats', {
        params: gymId ? { gymId } : {},
      });

      return data as GymStats;
    },
    staleTime: 60_000,
  });
}
