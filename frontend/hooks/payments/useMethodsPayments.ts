// hooks/pagos/usePagosApi.ts
import { useQuery, useMutation, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Payment } from '@/models/Payment/Payment';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
    const token = Cookies.get('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export function useMethodsPaymentsByGym(gymId: string) {
    return useQuery({
        queryKey: ['payment-methods', gymId],
        enabled: !!gymId,
        queryFn: async () => {
            const { data } = await axiosInstance.get('/api/payment-methods', {
                params: { gymId }
            });
            return data;
        },
        staleTime: 60 * 60_000,
    });
}


