import { Member } from '@/models/Member/Member';
import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query';
import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

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
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    refetchOnMount: false,
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
      const token = Cookies.get('token');
      if (!token) throw new Error('No se encontró token en la cookie');
      if (!gymId) throw new Error('No se encontró gym_id en la cookie');

      await axiosInstance.delete(`/api/alumnos/${dni}`, {
        params: { gym_id: gymId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return dni;
    },
    onSuccess: () => {}
  });
}

export function useEditAlumnoByDNI() {
  return useMutation<Member, Error, { dni: string; values: Record<string, any> }>({
    mutationFn: async ({ dni, values }) => {
      const res = await axiosInstance.put(`/api/alumnos/${dni}`, values);
      return res.data as Member;
    },
    onSuccess: () => {}
  });
}

export function useAddAlumno() {
  return useMutation({
    mutationFn: async (values: Record<string, any>) => {
      const res = await axiosInstance.post('/api/alumnos', values);
      return res.data;
    },
    onSuccess: () => {}
  });
}

export function useExpiredAlumnos(gymId: string) {
  return useQuery<{ items: any[]; total: number }>({
    queryKey: ['members-expired', gymId],
    enabled: Boolean(gymId),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/alumnos/expired', {
        params: { gym_id: gymId },
      });
      return data;
    },
  });
}

export function useAlumnosSimpleService(gymId: string) {
  return useQuery({
    queryKey: ['members-simple', gymId],
    enabled: Boolean(gymId),
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/alumnos/simple', {
        params: { gym_id: gymId },
      });
      return data;
    },
  });
}
