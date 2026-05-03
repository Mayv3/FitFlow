import { useQuery } from "@tanstack/react-query";

export interface ActiveMemberPayment {
  id: number;
  alumno_id: number;
  alumno_nombre: string;
  fecha_de_pago: string;
  monto_total: number;
  hora: string;
  plan_id: number | null;
  plan_nombre: string;
}

interface Response {
  gym_id: string;
  year: number;
  month: number;
  total: number;
  items: ActiveMemberPayment[];
}

export function useActiveMembersPaymentDetails(year: number, month: number) {
  return useQuery<Response>({
    queryKey: ["active-members-payment-details", year, month],
    queryFn: async () => {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (!token) throw new Error("No se encontró el token de autenticación");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stats/dashboard/activos-mes?year=${year}&month=${month}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error(`Error: ${res.status}`);

      return res.json();
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!month && month >= 1 && month <= 12,
  });
}
