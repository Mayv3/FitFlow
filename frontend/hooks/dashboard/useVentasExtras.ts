import { useQuery } from "@tanstack/react-query";

export interface VentasMes {
  mes: number;
  productos: number;
  servicios: number;
  ventas_productos: number;
  ventas_servicios: number;
}

export interface VentaTop {
  nombre: string;
  ventas: number;
  monto: number;
}

export interface VentasExtras {
  meses: VentasMes[];
  /** Los 5 de mayor facturación en el período pedido. */
  top_productos: VentaTop[];
  top_servicios: VentaTop[];
}

/** month = 0 pide el año completo. */
export function useVentasExtras(year: number, month: number) {
  return useQuery<VentasExtras>({
    queryKey: ["ventas-extras", year, month],
    queryFn: async () => {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (!token) throw new Error("No se encontró el token de autenticación");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stats/dashboard/ventas-extras?year=${year}&month=${month}`,
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
