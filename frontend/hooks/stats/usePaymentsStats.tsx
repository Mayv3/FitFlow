import { useQuery } from '@tanstack/react-query';

export function usePaymentsStats(gymId?: string) {
  return useQuery({
    queryKey: ['paymentsStats', gymId],
    queryFn: async () => {
      if (!gymId) return null;

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stats/payments?gymId=${gymId}`);
      if (!res.ok) {
        throw new Error('Error al obtener estadísticas de pagos');
      }
      return res.json();
    },
    enabled: !!gymId,
    staleTime: 1000 * 60,
  });
}
