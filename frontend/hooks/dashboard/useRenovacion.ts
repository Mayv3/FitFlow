import { useQuery } from "@tanstack/react-query";
import type { RenovacionMes } from "@/models/Stats/Renovacion";

export function useRenovacion(year: number) {
  return useQuery<RenovacionMes[]>({
    queryKey: ["renovacion", year],
    queryFn: async () => {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (!token) throw new Error("No se encontró el token de autenticación");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stats/dashboard/renovacion?year=${year}`,
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
