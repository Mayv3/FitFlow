import { AlumnoSimple, Member, MemberFormValues } from '@/models/Member/Member';
import { useQuery, useMutation, keepPreviousData, useQueryClient } from '@tanstack/react-query';
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

type GetAlumnosResponse<T = Member> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  q: string;
};

/**
 * Las tres listas de alumnos que hay en la app, cada una con su propia key.
 * Cualquier alta/edicion/baja las invalida a todas: si solo se refrescara
 * `members`, el select de Pagos (`alumnos-simple`) seguiria sin el alumno nuevo.
 */
const ALUMNOS_QUERY_KEYS = [
  ['members'],
  ['members-simple'],
  ['members-expired'],
  ['alumnos-simple'],
] as const;

/** Invalida por prefijo, asi alcanza a todas las variantes de page/limit/q. */
function useInvalidateAlumnos() {
  const qc = useQueryClient();
  return () => {
    ALUMNOS_QUERY_KEYS.forEach((queryKey) => {
      qc.invalidateQueries({ queryKey: [...queryKey] });
    });
  };
}

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
    staleTime: 0,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    refetchOnMount: 'always',
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
  const invalidateAlumnos = useInvalidateAlumnos();
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
    onSuccess: invalidateAlumnos,
  });
}

export function useEditAlumnoByDNI() {
  const invalidateAlumnos = useInvalidateAlumnos();
  return useMutation<Member, Error, { dni: string; values: MemberFormValues }>({
    mutationFn: async ({ dni, values }) => {
      const res = await axiosInstance.put(`/api/alumnos/${dni}`, values);
      return res.data as Member;
    },
    onSuccess: invalidateAlumnos,
  });
}

export function useAddAlumno() {
  const invalidateAlumnos = useInvalidateAlumnos();
  return useMutation({
    mutationFn: async (values: MemberFormValues) => {
      const res = await axiosInstance.post('/api/alumnos', values);
      return res.data;
    },
    onSuccess: invalidateAlumnos,
  });
}

export function useExpiredAlumnos(gymId: string) {
  return useQuery<{ items: Member[]; total: number }>({
    queryKey: ['members-expired', gymId],
    enabled: Boolean(gymId),
    staleTime: 0,
    refetchOnMount: 'always',
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
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async (): Promise<AlumnoSimple[]> => {
      const { data } = await axiosInstance.get('/api/alumnos/simple', {
        params: { gym_id: gymId },
      });
      return data;
    },
  });
}
