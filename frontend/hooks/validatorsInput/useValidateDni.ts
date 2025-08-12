import { useCallback } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

export const useValidateDniFromApi = () => {
  return useCallback(async (dni: string): Promise<string | null> => {
    const token = Cookies.get('token'); 
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

    if (!token || !baseUrl) {
      return 'No se pudo validar el DNI';
    }

    try {
      const response = await axios.get(`${baseUrl}/api/alumnos/${dni}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      return 'Este DNI ya está registrado';

    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }

      return 'No se pudo validar el DNI';
    }
  }, []);
};
