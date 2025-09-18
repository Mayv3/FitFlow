import { useQuery } from "@tanstack/react-query";

export function useKpis() {
  return useQuery({
    queryKey: ["kpis"],
    queryFn: async () => {
      if (typeof window === "undefined") {
        throw new Error("No se puede acceder a las cookies en el servidor");
      }

      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stats/dashboard/kpis`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      if (!res.ok) {
        throw new Error(`Error en la API KPIs: ${res.status} ${res.statusText}`);
      }

      return res.json();
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
}
