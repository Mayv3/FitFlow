import { useState, useEffect, useCallback } from "react"
import { Payment } from "@/models/dashboard"
import dayjs from "dayjs"
import { notify } from "@/lib/toast"

interface UseCashRegisterProps {
  selectedShift: string
  payments: Payment[]
  userName?: string
}

export function useCashRegister({
  selectedShift,
  payments,
  userName,
}: UseCashRegisterProps) {
  const [open, setOpen] = useState(false)
  const [initialAmount, setInitialAmount] = useState("0")
  const [cashId, setCashId] = useState<string | null>(null)
  const [cerrada, setCerrada] = useState(false)
  const [existe, setExiste] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const initCaja = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/caja/abierta/${selectedShift}`
      )
      const data = await res.json()
      if (!data.existe) {
        setExiste(false)
        setOpen(false)
        setCerrada(false)
        setCashId(null)
        return
      }
      setExiste(true)
      if (data.abierta) {
        setOpen(true)
        setInitialAmount(data.saldoInicial)
        setCashId(data.id)
        setCerrada(false)
      } else {
        setOpen(false)
        setCashId(null)
        setInitialAmount("0")
        setCerrada(true)
      }
    } catch (err) {
      console.error("Error verificando caja:", err)
    }
  }, [selectedShift])

  useEffect(() => {
    initCaja()
  }, [initCaja])

  const openCash = useCallback(async () => {
    try {
      const body: any = { turno: selectedShift, responsable: userName }
      if (selectedShift === "mañana") body.saldoInicial = initialAmount

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/caja/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const { message } = await res.json()
        setError(message)
        setTimeout(() => setError(null), 5000)
        return
      }
      const data = await res.json()
      setInitialAmount(data.saldoInicial)
      setCashId(data.id)
      setOpen(true)
      setCerrada(false)
      setError(null)

      notify.success("Caja abierta con éxito")
      localStorage.setItem("cajaAbierta", "true")
      localStorage.setItem("initialAmount", data.saldoInicial)
      localStorage.setItem("cashRegisterId", data.id)
      localStorage.removeItem("cajaCerrada")
    } catch (err) {
      console.error("Error al abrir caja:", err)
    }
  }, [initialAmount, selectedShift, userName])

  const closeCash = useCallback(async () => {
    try {
      if (!cashId) return
      const horaCierre = dayjs().format("HH:mm")
      const parsedInitial = parseFloat(initialAmount) || 0
      const total = payments.reduce((s, p) => s + Number(p.Monto || 0), 0)
      const totalEfectivo = payments
        .filter(p => p.Metodo_de_Pago === "Efectivo")
        .reduce((s, p) => s + Number(p.Monto || 0), 0)
      const totalTarjeta = payments
        .filter(p => p.Metodo_de_Pago === "Tarjeta")
        .reduce((s, p) => s + Number(p.Monto || 0), 0)

      const body = {
        "Hora Cierre": horaCierre,
        "Total Efectivo": String(totalEfectivo),
        "Total Tarjeta": String(totalTarjeta),
        "Saldo Inicial": initialAmount
      }
      console.log("Cierre de caja → body:", body)

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/caja/${cashId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      )
      if (!res.ok) {
        console.error("Error al cerrar caja")
        return
      }
      await res.json()
      setOpen(false)
      setInitialAmount("0")
      setCashId(null)
      setCerrada(true)
      localStorage.removeItem("cajaAbierta")
      localStorage.removeItem("initialAmount")
      localStorage.removeItem("cashRegisterId")
      localStorage.setItem("cajaCerrada", "true")
    } catch (err) {
      console.error("Error al cerrar caja:", err)
    }
  }, [cashId, initialAmount, payments])

  return {
    open,
    initialAmount,
    cashId,
    cerrada,
    existe,
    error,
    setInitialAmount,
    openCash,
    closeCash,
  }
}
