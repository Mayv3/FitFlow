'use client';

import { useQuery } from '@tanstack/react-query';
import Cookies from 'js-cookie';

interface Params {
  year: number;
  month: number;
}

export function useAlumnosPorOrigen({ year, month }: Params) {
  const gym_id = Cookies.get('gym_id');

  return useQuery({
    queryKey: ['alumnos-por-origen', gym_id, year, month],
    enabled: !!gym_id && !!year && !!month,
    queryFn: async () => {
      const token = Cookies.get('token');
      if (!token) throw new Error('No token');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stats/dashboard/gyms/${gym_id}/alumnos/origen?year=${year}&month=${month}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        }
      );

      if (!res.ok) {
        throw new Error(`Error API alumnos por origen: ${res.status}`);
      }

      const json = await res.json();

      return (json.items ?? []).map((row: any) => ({
        origen: row.origen,
        cantidad: row.total,
      }));
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}
