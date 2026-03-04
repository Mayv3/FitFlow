'use client';

import { useQuery } from '@tanstack/react-query';
import Cookies from 'js-cookie';

export function useFacturacionMes(year: number, month: number) {
  const gymId = Cookies.get('gym_id');

  return useQuery({
    queryKey: ['facturacion-mes', gymId, year, month],
    enabled: !!gymId && year > 0 && month >= 1,
    queryFn: async () => {
      const token = Cookies.get('token');
      if (!token) throw new Error('No token');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stats/dashboard/facturacion-mes?year=${year}&month=${month}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        }
      );

      if (!res.ok) throw new Error(`Error facturación mes: ${res.status}`);
      return res.json() as Promise<{ actual: number; anterior: number; deltaPct: number }>;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
