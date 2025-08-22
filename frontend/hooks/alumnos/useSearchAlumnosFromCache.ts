import { useQueryClient } from "@tanstack/react-query";

export const useSearchAlumnosFromCache = () => {
  const qc = useQueryClient();

  return (gymId: string, q: string) => {
    if (!gymId) return [];

    const alumnos = qc.getQueryData<any[]>(['alumnos', gymId]) ?? [];

    if (!q) return alumnos.map(a => ({
      label: `${a.nombre} (${a.dni})`,
      value: a.id,
    }));

    const lower = q.toLowerCase();

    return alumnos
      .filter(a =>
        a.nombre.toLowerCase().includes(lower) ||
        String(a.dni).includes(lower)
      )
      .map(a => ({
        label: `${a.nombre} (${a.dni})`,
        value: a.id,
      }));
  };
};