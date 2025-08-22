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
      console.log(`Valores mandados: ${values}`)
      return data as Payment;
    },
    onSuccess: (nuevoPago) => {
      console.log("✅ Pago creado desde backend:", nuevoPago);

      qc.setQueryData(
        ['payments', gymId, 1, 20, ''],
        (old: any) => {
          if (!old) {
            return { items: [nuevoPago], total: 1 };
          }

          return {
            ...old,
            items: [nuevoPago, ...old.items],
            total: (old.total ?? old.items.length) + 1,
          };
        }
      );
    },
    onError: (error: any) => {
      console.error('Error al crear pago', error);
    },
  });
}

export function useEditPago() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: number; values: Record<string, any> }) => {
      const { data } = await axiosInstance.put(`/api/pagos/${id}`, values);
      return data as Payment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

export function useDeletePago() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const gymId = Cookies.get('gym_id');
      if (!gymId) throw new Error('No se encontró gym_id en la cookie');

      await axiosInstance.delete(`/api/pagos/${id}`, {
        params: { gym_id: gymId },
      });
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}
