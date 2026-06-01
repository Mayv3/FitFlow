import { useCallback } from 'react';
import axios from 'axios';
import { api } from '@/lib/api';

export const useValidateDniFromApi = () => {
  return useCallback(async (dni: string): Promise<string | null> => {
    try {
      await api.get(`/api/alumnos/${dni}`);

      return 'Este DNI ya está registrado';

    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }

      return 'No se pudo validar el DNI';
    }
  }, []);
};
