import { useQuery } from '@tanstack/react-query';

function getTokenFromCookie() {
  if (typeof window === 'undefined') {
    throw new Error('No se puede acceder a las cookies en el servidor');
  }

  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('token='))
    ?.split('=')[1];
}

async function fetchWithAuth(url: string) {
  const token = getTokenFromCookie();

  if (!token) {
    throw new Error('No se encontró el token de autenticación');
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Error en la API: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Total de asistencias HOY
 */
export function useAsistenciasHoy(gymId: string) {
  return useQuery({
    queryKey: ['asistencias', 'hoy', gymId],
    queryFn: () =>
      fetchWithAuth(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stats/dashboard/gyms/${gymId}/asistencias/hoy`
      ),
    enabled: !!gymId,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useAsistenciasHoyPorHora(gymId: string) {
  return useQuery({
    queryKey: ['asistencias', 'hoy', 'por-hora', gymId],
    queryFn: () =>
      fetchWithAuth(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stats/dashboard/gyms/${gymId}/asistencias/hoy/por-hora`
      ),
    enabled: !!gymId,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}


