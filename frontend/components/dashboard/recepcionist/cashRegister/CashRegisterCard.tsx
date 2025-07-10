import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DollarSign } from "lucide-react"
import { motion } from "framer-motion"
import { useUser } from "@/context/UserContext"
import { useEffect } from "react"

interface CashRegisterCardProps {
  selectedShift: string
  initialAmount: string
  setInitialAmount: (value: string) => void
  currentShiftPayments: { Monto: number }[]
}

export function CashRegisterCard({
  selectedShift,
  initialAmount,
  setInitialAmount,
  currentShiftPayments,
}: CashRegisterCardProps) {
  const parsedInitial = parseFloat(initialAmount)
  const initial = isNaN(parsedInitial) ? 0 : parsedInitial
  const total = currentShiftPayments.reduce((sum, payment) => sum + Number(payment.Monto || 0), 0)
  const balance = initial + total
  const { user } = useUser()

  useEffect(() => {
    const verificarCajaAbierta = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/caja/abierta/${selectedShift}`)
        const data = await res.json()

        if (data.abierta) {
          setInitialAmount(data.saldoInicial)
        } else {
          setInitialAmount("0")
        }
      } catch (error) {
        console.error("Error al verificar caja abierta:", error)
      }
    }

    verificarCajaAbierta()
  }, [selectedShift])

  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="mb-4 border-primary/50 shadow-lg">
        <CardHeader className="bg-primary/10">
          <CardTitle className="flex items-center">
            <DollarSign className="mr-2 h-5 w-5 text-primary" />
            Caja Registradora
          </CardTitle>
          <CardDescription>
            Turno actual: {selectedShift.charAt(0).toUpperCase() + selectedShift.slice(1)} - Recepcionista: {user?.nombre}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="initialAmount">Monto Inicial</Label>
              <Input
                id="initialAmount"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                type="number"
                min="0"
                className="border-primary/50 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label>Total Recaudado</Label>
              <div className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm font-semibold text-green-600">
                ${total.toLocaleString("es-AR")}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Balance Final</Label>
              <div className="h-10 px-3 py-2 rounded-md border border-primary bg-primary/5 text-sm font-bold">
                ${balance.toLocaleString("es-AR")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
