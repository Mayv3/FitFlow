// hooks/pagos/usePagosApi.ts
import { useQuery, useMutation, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Payment } from '@/models/Payment/Payment';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

type GetPaymentsResponse<T = Payment> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  q: string;
};

const key = (gymId: string, page: number, limit: number, q: string) =>
  ['payments', gymId, page, limit, q] as const;

export function usePagosByGym(
  gymId: string,
  page = 1,
  limit = 20,
  q = ''
) {
  return useQuery<GetPaymentsResponse>({
    queryKey: key(gymId, page, limit, q),
    enabled: Boolean(gymId),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/pagos', {
        params: { gym_id: gymId, page, limit, q },
      });
      return data as GetPaymentsResponse;
    },
  });
}

export function useAddPago(gymId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (values: Record<string, any>) => {
      const { data } = await axiosInstance.post('/api/pagos', values);
      return data as Payment;
    },
    onSuccess: (nuevoPago) => {
      qc.setQueryData(['payments', gymId, 1, 20, ''], (old: any) => {
        if (!old) return { items: [nuevoPago], total: 1 };
        return {
          ...old,
          items: [nuevoPago, ...old.items],
          total: (old.total ?? old.items.length) + 1,
        };
      });

      qc.setQueryData(['alumnos', gymId, 1, 20, ''], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((a: any) =>
            a.id === nuevoPago.alumno_id
              ? {
                  ...a,
                  plan_id: nuevoPago.plan_id,
                  plan_nombre: nuevoPago.plan_nombre,
                  fecha_de_vencimiento: nuevoPago.fecha_de_venc,
                }
              : a
          ),
        };
      });

    },
  });
}

export function useEditPago(gymId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: { id: number; values: Record<string, any> }) => {
      const { data } = await axiosInstance.put(`/api/pagos/${id}`, values);
      return data as Payment;
    },
    onSuccess: (updatedPago) => {
      if (!updatedPago?.id) return;

      qc.setQueryData(['payments', gymId, 1, 20, ''], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((p: any) =>
            p.id === updatedPago.id ? { ...p, ...updatedPago } : p
          ),
        };
      });
    },
  });
}

export function useDeletePago(gymId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await axiosInstance.delete(`/api/pagos/${id}`, { params: { gym_id: gymId } });
      return id;
    },
    onSuccess: (deletedId) => {
      qc.setQueryData(['payments', gymId, 1, 20, ''], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.filter((p: any) => p.id !== deletedId),
          total: (old.total ?? old.items.length) - 1,
        };
      });
    },
  });
}
