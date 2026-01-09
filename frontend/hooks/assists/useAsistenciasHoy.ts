import { useQuery } from '@tanstack/react-query';

function getTokenFromCookie(): string | null {
  if (typeof window === 'undefined') return null;

  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('token='))?.split('=')[1] ?? null;
}

async function fetchWithAuth(url: string) {
  const token = getTokenFromCookie();
  if (!token) throw new Error('No auth token');

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Error en la API: ${res.status}`);
  }

  return res.json();
}

type Params = {
  fecha?: string | null;
};

export function useAsistencias(gymId?: string, params?: Params) {
  const fecha = params?.fecha;
  const qs = fecha ? `?fecha=${fecha}` : '';

  return useQuery({
    queryKey: ['asistencias', gymId, fecha],
    queryFn: async () => {
      if (!gymId) return null;

      const baseUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stats/dashboard/gyms/${gymId}`;

      const [resTotal, resPorHora] = await Promise.all([
        fetchWithAuth(`${baseUrl}/asistencias${qs}`),
        fetchWithAuth(`${baseUrl}/asistencias/por-hora${qs}`),
      ]);

      return {
        gym_id: gymId,
        fecha: resTotal.fecha,
        total: resTotal.total,
        porHora: resPorHora.items,
      };
    },
    enabled: !!gymId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
