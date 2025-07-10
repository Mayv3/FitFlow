"use client"
import { Button } from "@/components/ui/button"
import { DollarSign } from "lucide-react"
import { CashRegisterCard } from "@/components/dashboard/recepcionist/cashRegister/CashRegisterCard"
import { useState } from "react"

type CashRegisterSectionProps = {
  cashRegisterOpen: boolean
  initialAmount: string
  selectedShift: string
  currentShiftPayments: any[]
  onOpenCashRegister: () => void
  onCloseCashRegister: () => void
  setInitialAmount: (value: string) => void
  errorMessage?: string | null
}

export default function CashRegisterSection({
  cashRegisterOpen,
  initialAmount,
  selectedShift,
  currentShiftPayments,
  onOpenCashRegister,
  onCloseCashRegister,
  setInitialAmount,
  errorMessage
}: CashRegisterSectionProps) {

  const [loading, setLoading] = useState(false)
  const [closing, setClosing] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-x-2">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          Panel de recepcionista
        </h1>
        {errorMessage && (
          <div className="text-sm text-red-600 font-medium mt-2">
            {errorMessage}
          </div>
        )}
        {!cashRegisterOpen ? (
          <Button
            variant="orange"
            onClick={async () => {
              setLoading(true)
              try {
                await onOpenCashRegister()
              } finally {
                setLoading(false)
              }
            }}
            className="animate-pulse-scale"
            disabled={selectedShift === "todos" || loading}
          >
            {loading ? (
              <div className="flex items-center">
                <svg
                  className="animate-spin mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                  />
                </svg>
                Abriendo...
              </div>
            ) : (
              <>
                <DollarSign className="mr-2 h-4 w-4" />
                Abrir Caja
              </>
            )}
          </Button>

        ) : (
          <Button
            variant="destructive"
            onClick={async () => {
              setClosing(true)
              try {
                await onCloseCashRegister()
              } finally {
                setClosing(false)
              }
            }}
            disabled={closing}
          >
            {closing ? (
              <div className="flex items-center">
                <svg
                  className="animate-spin mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                  />
                </svg>
                Cerrando...
              </div>
            ) : (
              <>
                <DollarSign className="mr-2 h-4 w-4" />
                Cerrar Caja
              </>
            )}
          </Button>
        )}
      </div>

      {selectedShift === "todos" && (
        <div className="flex justify-center">
          <p className="text-lg text-red-600">
            Por favor selecciona un turno (mañana o tarde) para abrir la caja en PAGOS.
          </p>
        </div>
      )}

      {cashRegisterOpen && (
        <>
          <CashRegisterCard
            selectedShift={selectedShift}
            initialAmount={initialAmount}
            setInitialAmount={setInitialAmount}
            currentShiftPayments={currentShiftPayments}
          />
        </>
      )}

    </div>
  )
}
