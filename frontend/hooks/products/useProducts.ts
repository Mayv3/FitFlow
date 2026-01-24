import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const axiosInstance = axios.create({ baseURL: API_URL, withCredentials: true });

axiosInstance.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

type Product = {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock?: number;
  categoria?: string;
  activo?: boolean;
  gym_id: string;
};

type GetProductsResponse<T = Product> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  q: string;
};

const key = (gymId: string, page: number, limit: number, q: string, categoria?: string) =>
  ['products', gymId, page, limit, q, categoria] as const;

export function useProducts(gymId: string, page = 1, limit = 20, q = '', categoria?: string) {
  return useQuery<GetProductsResponse>({
    queryKey: key(gymId, page, limit, q, categoria),
    enabled: Boolean(gymId),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/productos', {
        params: { gym_id: gymId, page, pageSize: limit, q, categoria },
      });
      // Si el backend devuelve un array directamente, lo convertimos al formato esperado
      if (Array.isArray(data)) {
        return { items: data, total: data.length } as GetProductsResponse;
      }
      return data as GetProductsResponse;
    },
  });
}

export function useAddProduct(gymId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<Product>) => {
      const { data } = await axiosInstance.post('/api/productos', values);
      return data as Product;
    },
    onSuccess: (nuevo) => {
      qc.invalidateQueries({ queryKey: ['products', gymId] });
    },
  });
}

export function useEditProduct(gymId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<Product> }) => {
      const { data } = await axiosInstance.put(`/api/productos/${id}`, values);
      return data as Product;
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['products', gymId] });
    },
  });
}

export function useDeleteProduct(gymId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/api/productos/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      qc.setQueriesData<GetProductsResponse>(
        { queryKey: ['products', gymId] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.filter((p) => p.id !== deletedId),
            total: (old.total ?? old.items.length) - 1,
          };
        }
      );
    },
  });
}

export function useUpdateStock(gymId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, cantidad, operacion }: { id: string; cantidad: number; operacion: 'incrementar' | 'decrementar' }) => {
      const { data } = await axiosInstance.patch(`/api/productos/${id}/stock`, { cantidad, operacion });
      return data as Product;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products', gymId] });
    },
  });
}
