import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const axiosInstance = axios.create({ baseURL: API_URL, withCredentials: true });

axiosInstance.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

type Service = {
  id: string;
  nombre: string;
  descripcion?: string;
  duracion_minutos?: number;
  precio?: number;
  color?: string;
  gym_id: string;
};

type GetServicesResponse<T = Service> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  q: string;
};

const key = (gymId: string, page: number, limit: number, q: string) =>
  ['services', gymId, page, limit, q] as const;

export function useServices(gymId: string, page = 1, limit = 20, q = '') {
  return useQuery<GetServicesResponse>({
    queryKey: key(gymId, page, limit, q),
    enabled: Boolean(gymId),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/servicios', {
        params: { gym_id: gymId, page, limit, q },
      });
      return data as GetServicesResponse;
    },
  });
}

export function useAddService(gymId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<Service>) => {
      const { data } = await axiosInstance.post('/api/servicios', values);
      return data as Service;
    },
    onSuccess: (nuevo) => {
      qc.invalidateQueries({ queryKey: ['services', gymId] });
    },
  });
}

export function useEditService(gymId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<Service> }) => {
      const { data } = await axiosInstance.put(`/api/servicios/${id}`, values);
      return data as Service;
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['services', gymId] });
    },
  });
}

export function useDeleteService(gymId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/api/servicios/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      qc.setQueriesData<GetServicesResponse>(
        { queryKey: ['services', gymId] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.filter((s) => s.id !== deletedId),
            total: (old.total ?? old.items.length) - 1,
          };
        }
      );
    },
  });
}
