'use client';

import { useQuery } from '@tanstack/react-query';
import Cookies from 'js-cookie';

export function usePlanMasVendidoMes(year: number, month: number) {
  const gymId = Cookies.get('gym_id');

  return useQuery({
    queryKey: ['plan-mas-vendido-mes', gymId, year, month],
    enabled: !!gymId && year > 0 && month >= 1,
    queryFn: async () => {
      const token = Cookies.get('token');
      if (!token) throw new Error('No token');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stats/dashboard/plan-mas-vendido?year=${year}&month=${month}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        }
      );

      if (!res.ok) throw new Error(`Error plan más vendido: ${res.status}`);
      return res.json() as Promise<{ name: string; count: number; sharePct: number }[]>;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
