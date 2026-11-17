import { useQuery } from "@tanstack/react-query";
import type { PermanenciaResponse } from "@/models/Stats/Permanencia";

export function usePermanencia() {
  return useQuery<PermanenciaResponse>({
    queryKey: ["permanencia"],
    queryFn: async () => {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (!token) throw new Error("No se encontró el token de autenticación");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stats/dashboard/permanencia`,
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
