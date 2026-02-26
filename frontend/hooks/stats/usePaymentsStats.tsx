import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function usePaymentsStats(
  gymId?: string,
  filters?: { fromDate?: string | null; toDate?: string | null }
) {
  return useQuery({
    queryKey: ['paymentsStats', gymId, filters?.fromDate ?? null, filters?.toDate ?? null],
    queryFn: async () => {
      if (!gymId) return null;
      const { data } = await api.get('/api/stats/payments', {
        params: {
          gymId,
          fromDate: filters?.fromDate,
          toDate: filters?.toDate,
        },
      });
      return data;
    },
    enabled: !!gymId,
    staleTime: 1000 * 60,
  });
}
