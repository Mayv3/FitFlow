import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = Cookies.get('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type GetAlumnosResponse<T = any> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  q: string;
};

export function useAlumnosByGym(
  gymId: string,
  page = 1,
  limit = 20,
  q = ''
) {
  return useQuery<GetAlumnosResponse>({
    queryKey: ['members', gymId, page, limit, q],
    enabled: Boolean(gymId),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000 * 2,
    retry: 1,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/alumnos', {
        params: { gym_id: gymId, page, limit, q },
      });
      return data as GetAlumnosResponse;
    },
  });
}

export function useDeleteAlumnoByDNI() {
  return useMutation({
    mutationFn: async (dni: string) => {
      const gymId = Cookies.get('gym_id');
      if (!gymId) throw new Error('No se encontró gym_id en la cookie');

      await axiosInstance.delete(`/api/alumnos/${dni}`, {
        params: { gym_id: gymId },
      });
      return dni;
    },
  });
}

export function useEditAlumnoByDNI() {

  return useMutation({
    mutationFn: async ({
      dni,
      values,
    }: {
      dni: string;
      values: Record<string, any>;
    }) => {
      const res = await axiosInstance.put(`/api/alumnos/${dni}`, values);
      return res.data;
    },

  });
}

export function useAddAlumno() {
  return useMutation({
    mutationFn: async (values: Record<string, any>) => {
      const res = await axiosInstance.post('/api/alumnos', values);
      return res.data;
    },
  });
}
