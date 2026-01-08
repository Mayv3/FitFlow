import { useQuery } from '@tanstack/react-query';

function getTokenFromCookie(): string | null {
  if (typeof window === 'undefined') return null;

  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('token='))
    ?.split('=')[1] ?? null;
}

async function fetchWithAuth(url: string) {
  const token = getTokenFromCookie();
  if (!token) return null;

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

export function useAsistenciasHoy(gymId?: string) {
  return useQuery({
    queryKey: ['asistencias', 'hoy', gymId],
    queryFn: () =>
      gymId
        ? fetchWithAuth(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stats/dashboard/gyms/${gymId}/asistencias/hoy`
          )
        : null,
    enabled: !!gymId,
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useAsistenciasHoyPorHora(gymId?: string) {
  return useQuery({
    queryKey: ['asistencias', 'hoy', 'por-hora', gymId],
    queryFn: () =>
      gymId
        ? fetchWithAuth(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stats/dashboard/gyms/${gymId}/asistencias/hoy/por-hora`
          )
        : null,
    enabled: !!gymId,
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  });
}
