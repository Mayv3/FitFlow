import { useEffect, useState } from 'react';

type FetchState<T> = {
  data: [] | null;
  loading: boolean;
  error: string | null;
};

const fetchCache: Record<string, any> = {};
const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
};

export function useFetchOnce<T>(url: string) {
  const [state, setState] = useState<FetchState<T>>(() => {
    if (fetchCache[url]) {
      return {
        data: fetchCache[url],
        loading: false,
        error: null,
      };
    }
    return {
      data: null,
      loading: true,
      error: null,
    };
  });

  useEffect(() => {
    if (fetchCache[url]) return;

    let isMounted = true;
    const token = getCookie('token');
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Token inválido o acceso no autorizado');
        const json = await res.json();
        fetchCache[url] = json;
        if (isMounted) {
          setState({ data: json, loading: false, error: null });
        }
      })
      .catch((err) => {
        if (isMounted) {
          setState({ data: null, loading: false, error: err.message || 'Error' });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [url]);

  return state;
}
