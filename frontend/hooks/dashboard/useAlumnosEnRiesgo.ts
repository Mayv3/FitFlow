import { useQuery } from "@tanstack/react-query";
import type { AlumnosEnRiesgoResponse } from "@/models/Stats/EnRiesgo";

export function useAlumnosEnRiesgo(dias = 14) {
  return useQuery<AlumnosEnRiesgoResponse>({
    queryKey: ["alumnos-en-riesgo", dias],
    queryFn: async () => {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (!token) throw new Error("No se encontró el token de autenticación");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stats/dashboard/en-riesgo?dias=${dias}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error(`Error: ${res.status}`);

      return res.json();
    },
    staleTime: 2 * 60 * 1000,
  });
}
