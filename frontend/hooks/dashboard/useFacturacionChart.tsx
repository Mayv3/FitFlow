import { useQuery } from "@tanstack/react-query";

export type RangoFacturacion = "12m" | "30d" | "7w" | "24h";

export function useFacturacionChart(
    gymId: string,
    year: number,
    range: RangoFacturacion,
    options?: { enabled?: boolean }
) {
    return useQuery({
        queryKey: ["facturacion-chart", gymId, year, range],
        enabled: options?.enabled ?? true,
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
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stats/dashboard/gyms/${gymId}/facturacion?year=${year}&range=${range}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    credentials: "include",
                }
            );

            if (!res.ok) {
                throw new Error(`Error Facturación: ${res.status}`);
            }

            return res.json();
        },
        staleTime: 2 * 60 * 1000,
    });
}

