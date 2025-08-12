'use client';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';

type Plan = {
  id: number;
  nombre: string;
  numero_clases: number;
  precio: number;
  gym_id: string;
};
const planesKey = (gymId: string) => ['planes-precios', gymId] as const;

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
        value: p.id,                 // 👈 número, no String(p.id)
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

export const usePlanNameFromCache = () => {
  const qc = useQueryClient();
  return (gymId: string, planId?: string | number | null) => {
    if (!gymId || planId == null) return null;
    const planes = qc.getQueryData<Array<{ id: number; nombre: string }>>(planesKey(gymId)) ?? [];
    const p = planes.find(x => String(x.id) === String(planId));
    return p?.nombre ?? null;
  };
};