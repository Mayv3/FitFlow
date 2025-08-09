import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { gunzip } from 'zlib';

type Plan = {
  id: number;
  nombre: string;
  numero_clases: number;
  precio: number;
  gym_id: string;
};

export const usePlanesPrecios = (gymId?: string) => {
  const query = useQuery({
    queryKey: ['planes-precios', gymId],
    enabled: !!gymId,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<Plan[]> => {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/planes`,
        { params: { gymId } }
      );
      return data;
    },
    select: (rows: Plan[]) => {
      const options = rows.map(p => ({
        label: `${p.nombre} — ${p.numero_clases} clases ($${p.precio})`,
        value: String(p.id),
      }));
      const byId = rows.reduce<Record<string, Plan>>((acc, p) => {
        acc[String(p.id)] = p;
        return acc;
      }, {});
      return { rows, options, byId };
    },
  });

  return {
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    options: query.data?.options ?? [],
    byId: query.data?.byId ?? {},
    rows: query.data?.rows ?? [],
    error: query.error,
  };
};
