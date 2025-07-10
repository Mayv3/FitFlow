import { useState, useCallback } from "react"
import { Payment } from "@/models/dashboard"

export interface PaymentsFilters {
  dia?: number
  mes?: number
  anio?: number
  turno?: string
}

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([])

  const fetchPayments = useCallback(async (filters: PaymentsFilters) => {
    try {
      const params = new URLSearchParams()
      if (filters.dia != null) params.append("dia", String(filters.dia))
      if (filters.mes != null) params.append("mes", String(filters.mes))
      if (filters.anio != null) params.append("anio", String(filters.anio))
      if (filters.turno) params.append("turno", filters.turno)

      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pagos?${params.toString()}`
      console.log(url)
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: Payment[] = await res.json()
      setPayments(data)
    } catch (err) {
      console.error("Error al cargar pagos:", err)
    }
  }, [])

  return { payments, refreshPayments: fetchPayments }
}
