import { useEffect, useState } from 'react';

type FetchState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

const fetchCache: Record<string, any> = {};

const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
};

/**
 * Hook para hacer fetch una sola vez con autenticación Bearer.
 * @param url Endpoint a llamar
 * @param init Opciones de fetch adicionales (headers, method, body...)
 */

export function useFetchOnce<T>(
  url: string,
  init?: RequestInit
): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>(() => {
    if (fetchCache[url]) {
      return { data: fetchCache[url] as T, loading: false, error: null };
    }
    return { data: null, loading: true, error: null };
  });

  useEffect(() => {
    if (fetchCache[url]) return;
    let isMounted = true;

    const token = getCookie('token');
    console.log(`Token: ${token}`)
    const headers = new Headers(init?.headers as HeadersInit);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');

    fetch(url, { ...init, headers })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Error en fetch');
        }
        return res.json() as Promise<T>;
      })
      .then((json) => {
        fetchCache[url] = json;
        if (isMounted) {
          setState({ data: json, loading: false, error: null });
        }
      })
      .catch((err: Error) => {
        if (isMounted) {
          setState({ data: null, loading: false, error: err.message });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [url, init]);

  return state;
}
