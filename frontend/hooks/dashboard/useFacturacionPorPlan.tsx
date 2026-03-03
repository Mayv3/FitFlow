'use client';

import { useQuery } from '@tanstack/react-query';
import Cookies from 'js-cookie';

export interface FacturacionPorPlanRow {
  plan_id: string;
  plan_nombre: string;
  actual: number;
  anterior: number;
  variacion: number;
}

export function useFacturacionPorPlan(year: number, month: number) {
  const gymId = Cookies.get('gym_id');

  return useQuery({
    queryKey: ['facturacion-por-plan', gymId, year, month],
    enabled: !!gymId && year > 0 && month >= 1,
    queryFn: async () => {
      const token = Cookies.get('token');
      if (!token) throw new Error('No token');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stats/dashboard/planes/facturacion?year=${year}&month=${month}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        }
      );

      if (!res.ok) throw new Error(`Error facturación por plan: ${res.status}`);
      return res.json() as Promise<FacturacionPorPlanRow[]>;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
