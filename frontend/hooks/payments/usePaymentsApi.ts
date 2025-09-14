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

const key = (
  gymId: string,
  page: number,
  limit: number,
  q: string,
  fromDate?: string | null,
  toDate?: string | null
) => ['payments', gymId, page, limit, q, fromDate, toDate] as const;

export function usePagosByGym(
  gymId: string,
  page = 1,
  limit = 20,
  q = '',
  filters?: { fromDate?: string | null; toDate?: string | null }
) {
  return useQuery<GetPaymentsResponse>({
    queryKey: key(gymId, page, limit, q, filters?.fromDate, filters?.toDate),
    enabled: Boolean(gymId),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/pagos', {
        params: {
          page,
          limit,
          q,
          fromDate: filters?.fromDate,
          toDate: filters?.toDate,
        },
      });
      return data as GetPaymentsResponse;
    },
  });
}

export function useAddPago(gymId: string, filters?: { fromDate?: string | null; toDate?: string | null }) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (values: Record<string, any>) => {
      const { data } = await axiosInstance.post('/api/pagos', values);
      return data as Payment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['paymentsStats'] });
    }
  });
}

export function useEditPago(
  gymId: string,
  filters?: { fromDate?: string | null; toDate?: string | null }
) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: { id: number; values: Record<string, any> }) => {
      const { data } = await axiosInstance.put(`/api/pagos/${id}`, values);
      return data as Payment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['paymentsStats'] });
    }
  });
}

export function useDeletePago(
  gymId: string,
  filters?: { fromDate?: string | null; toDate?: string | null }) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await axiosInstance.delete(`/api/pagos/${id}`);;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['paymentsStats'] });
    }
  });
}
