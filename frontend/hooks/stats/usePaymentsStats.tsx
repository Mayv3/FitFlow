import { useQuery } from '@tanstack/react-query';
import Cookies from 'js-cookie';

export function usePaymentsStats(
  gymId?: string,
  filters?: { fromDate?: string | null; toDate?: string | null }
) {
  return useQuery({
    queryKey: ['paymentsStats', gymId, filters?.fromDate ?? null, filters?.toDate ?? null],
    queryFn: async () => {
      if (!gymId) return null;

      const url = new URL(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stats/payments`);
      url.searchParams.append('gymId', gymId);
      if (filters?.fromDate) url.searchParams.append('fromDate', filters.fromDate);
      if (filters?.toDate) url.searchParams.append('toDate', filters.toDate);

      const token = Cookies.get('token');

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Error al obtener estadísticas de pagos');
      }
      return res.json();
    },
    enabled: !!gymId,
    staleTime: 1000 * 60,
  });
}
