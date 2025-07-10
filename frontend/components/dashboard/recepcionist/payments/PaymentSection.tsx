"use client"

import { ShiftPaymentsTab } from "@/components/dashboard/recepcionist/payments/ShiftPaymentsTab"

interface PaymentsSectionProps {
  currentShiftPayments: any[]

  selectedDate: Date
  setSelectedDate: (date: Date) => void

  selectedDay?: number
  setSelectedDay: (n?: number) => void
  selectedMonth?: number
  setSelectedMonth: (n?: number) => void
  selectedYear?: number
  setSelectedYear: (n?: number) => void

  selectedShift: string
  setSelectedShift: (value: string) => void

  onShowAddPayment: () => void
  setSelectedPaymentToDelete: (value: any) => void
  setShowDeletePaymentDialog: (value: boolean) => void
  onMemberUpdated: (
    dni: string,
    nuevaFecha: string,
    nuevoPlan: string,
    clasesPagadas: number
  ) => void
  refreshPayments: () => void

  cashOpen: boolean
}

export default function PaymentsSection({
  currentShiftPayments,
  selectedDay,
  setSelectedDay,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  selectedShift,
  setSelectedShift,
  onShowAddPayment,
  setSelectedPaymentToDelete,
  setShowDeletePaymentDialog,
  onMemberUpdated,
  refreshPayments,

  cashOpen,
}: PaymentsSectionProps) {
  return (
    <ShiftPaymentsTab
      cashOpen={cashOpen}
      currentShiftPayments={currentShiftPayments}

      selectedDay={selectedDay}
      setSelectedDay={setSelectedDay}
      selectedMonth={selectedMonth}
      setSelectedMonth={setSelectedMonth}
      selectedYear={selectedYear}
      setSelectedYear={setSelectedYear}

      selectedShift={selectedShift}
      setSelectedShift={setSelectedShift}

      setShowAddPayment={onShowAddPayment}
      setSelectedPaymentToDelete={setSelectedPaymentToDelete}
      setShowDeletePaymentDialog={setShowDeletePaymentDialog}
      onMemberUpdated={onMemberUpdated}
      refreshPayments={refreshPayments}
    />
  )
}
