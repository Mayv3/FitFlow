import { useQuery } from "@tanstack/react-query";

/** dia: 1 = lunes … 7 = domingo. hora: 0-23. */
export interface HeatmapCelda {
  dia: number;
  hora: number;
  total: number;
}

/** month = 0 pide el año completo. */
export function useAsistenciasHeatmap(year: number, month: number) {
  return useQuery<HeatmapCelda[]>({
    queryKey: ["asistencias-heatmap", year, month],
    queryFn: async () => {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (!token) throw new Error("No se encontró el token de autenticación");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stats/dashboard/asistencias-heatmap?year=${year}&month=${month}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error(`Error: ${res.status}`);

      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
