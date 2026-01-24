import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';

const API_BASE = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api`;

type Novedad = {
  id: number;
  titulo: string;
  descripcion?: string;
  tipo: 'novedad' | 'feature' | 'promocion' | 'evento' | 'error' | 'fix';
  activo: boolean;
  fecha_inicio?: string;
  fecha_fin?: string;
  imagen_url?: string;
  orden: number;
  created_at: string;
  updated_at: string;
};

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${Cookies.get('token')}`,
});

// GET novedades
export const useNovedades = () => {
  return useQuery({
    queryKey: ['novedades'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/novedades`, {
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Error al obtener novedades');
      }

      return response.json();
    },
  });
};

// CREATE novedad
export const useCreateNovedad = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (novedad: Partial<Novedad>) => {
      const response = await fetch(`${API_BASE}/novedades`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(novedad),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear novedad');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['novedades'] });
    },
  });
};

// UPDATE novedad
export const useUpdateNovedad = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Novedad> }) => {
      const response = await fetch(`${API_BASE}/novedades/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al actualizar novedad');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['novedades'] });
    },
  });
};

// DELETE novedad
export const useDeleteNovedad = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${API_BASE}/novedades/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al eliminar novedad');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['novedades'] });
    },
  });
};

// TOGGLE activo
export const useToggleActivoNovedad = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, activo }: { id: number; activo: boolean }) => {
      const response = await fetch(`${API_BASE}/novedades/${id}/activo`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ activo }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al cambiar estado');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['novedades'] });
    },
  });
};