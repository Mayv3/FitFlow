'use client';

import { useQuery } from '@tanstack/react-query';

export function usePlanes(
  year: number = new Date().getFullYear(),
  month: number = new Date().getMonth() + 1
) {
  return useQuery({
    queryKey: ['planes', year, month],
    queryFn: async () => {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        throw new Error('No se encontró el token');
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stats/dashboard/planes?year=${year}&month=${month}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        }
      );

      if (!res.ok) {
        throw new Error(`Error en la API Planes: ${res.status}`);
      }

      return res.json();
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}
