import { Member } from '@/models/Member/Member';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();

  return useMutation<Member, Error, { dni: string; values: Record<string, any> }>({
    mutationFn: async ({ dni, values }) => {
      const res = await axiosInstance.put(`/api/alumnos/${dni}`, values);
      return res.data as Member;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    }
  });
}

export function useAddAlumno() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: Record<string, any>) => {
      const res = await axiosInstance.post('/api/alumnos', values);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    }
  });
}
