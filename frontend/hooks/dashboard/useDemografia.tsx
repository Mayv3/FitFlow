'use client';

import { useQuery } from '@tanstack/react-query';

export function useDemografia(year: number = new Date().getFullYear()) {
  return useQuery({
    queryKey: ['demografia', year],
    queryFn: async () => {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stats/dashboard/demografia?year=${year}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        }
      );

      if (!res.ok) {
        throw new Error(`Error en la API Demografía: ${res.status}`);
      }

      return res.json();
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}
