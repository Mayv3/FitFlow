import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export function useAlumnosByGym(gymId: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['members', gymId, page, limit],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/alumnos', {
        params: { gym_id: gymId, page, limit },
      });
      return res.data;
    },
    enabled: Boolean(gymId),
    staleTime: 60 * 60_000,
    retry: 1,
  });
}

export function useDeleteAlumnoByDNI() {
  return useMutation({
    mutationFn: async (dni: string) => {
      await axiosInstance.delete(`/api/alumnos/${dni}`);
      return dni;
    }
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
