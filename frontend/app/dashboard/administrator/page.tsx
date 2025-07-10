"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, TrendingUp } from "lucide-react"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { MembersStatsTab } from "@/components/dashboard/administrator/MembersStatsTab"
import AdminOverviewCharts from "@/components/dashboard/administrator/AdminOverviewCharts"

import PaymentsSection from "@/components/dashboard/recepcionist/payments/PaymentSection"
import AssistsSection from "@/components/dashboard/recepcionist/assists/AssistsClases"
import PlansSection from "@/components/dashboard/recepcionist/plans/PlansSection"
import ShiftsSection from "@/components/dashboard/recepcionist/shifts/ShiftSection"
import CashRegisterSection from "@/components/dashboard/recepcionist/cashRegister/CashRegisterSection"

import { AddMemberDialog } from "@/components/dashboard/recepcionist/members/add-member-dialog"
import { EditMemberDialog } from "@/components/dashboard/recepcionist/members/edit-member-dialog"
import { DeleteMemberDialog } from "@/components/dashboard/recepcionist/members/delete-member-dialog"
import { AddPaymentDialog } from "@/components/dashboard/recepcionist/payments/add-payment-dialog"
import { DeletePaymentDialog } from "@/components/dashboard/recepcionist/payments/delete-payment-dialog"

import { useUser } from "@/context/UserContext"
import { useRouter } from "next/navigation"

import { useMembers } from "@/hooks/useMember"
import { PaymentsFilters, usePayments } from "@/hooks/usePayments"
import { useCashRegister } from "@/hooks/useCashRegister"
import { useDialogManager } from "@/hooks/useDialogManager"
import { useAppData } from "@/context/AppDataContext"

import { Member } from "@/models/dashboard";
import EgresosSection from "@/components/dashboard/recepcionist/egresos/EgresosSection"
import { format } from "date-fns"
import DebtsSection from "@/components/dashboard/recepcionist/deudas/Deudas"
import { ElClub } from "@/components/dashboard/recepcionist/elclub/ElClub"


export default function AdministratorDashboard() {
  const { user, loading } = useUser()

  const [showAddMember, setShowAddMember] = useState(false)
  const [tabValue, setTabValue] = useState("overview")
  const router = useRouter()

  const { updateAttendance } = useMembers()
  const { alumnos, setAlumnos } = useAppData();
  const [members, setMembers] = useState<Member[]>([]);

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedShift, setSelectedShift] = useState("todos")

  const today = new Date()

  const [selectedDay, setSelectedDay] = useState<number | undefined>(undefined)
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear())

  const buildCurrentFilters = (): PaymentsFilters => {
    const dynamicToday = new Date()
    return {
      dia: cashOpen ? dynamicToday.getDate() : selectedDay,
      mes: selectedMonth,
      anio: selectedYear,
      turno: selectedShift,
    }
  }

  const { payments, refreshPayments } = usePayments()

  const {
    open: cashOpen,
    initialAmount,
    error: cashError,
    cerrada,
    existe,
    openCash,
    closeCash,
    setInitialAmount
  } = useCashRegister({ selectedShift, payments, userName: user?.nombre })

  const { dialogs, selection, closeDialog, onDeletePayment, onShowAddPayment } = useDialogManager(cashOpen)

  const handleOpenCashRegister = () => {
    const now = new Date()
    setSelectedDay(now.getDate())
    setSelectedMonth(now.getMonth() + 1)
    setSelectedYear(now.getFullYear())
    openCash()
  }

  const handleMemberUpdated = (
    dni: string,
    nuevaFecha: string,
    nuevoPlan: string,
    clasesPagadas: number
  ) => {
    setMembers(prev =>
      prev.map(m =>
        m.DNI === dni
          ? {
            ...m,
            Fecha_vencimiento: nuevaFecha,
            Plan: nuevoPlan,
            Clases_pagadas: clasesPagadas,
            Clases_realizadas: 0,
          }
          : m
      )
    )
    setAlumnos(prev =>
      prev.map(a =>
        a.DNI === dni
          ? {
            ...a,
            Fecha_vencimiento: nuevaFecha,
            Plan: nuevoPlan,
            Clases_pagadas: clasesPagadas.toString(),
            Clases_realizadas: "0",
          }
          : a
      )
    )
  }

  const onMemberAdded = (newMember: Member) => {
    setMembers(prev => [...prev, newMember]);
    closeDialog("addMember");
  };

  const onMemberEdited = (edited: Member) => {
    setMembers(prev =>
      prev.map(m => m.DNI === edited.DNI ? edited : m)
    );
    closeDialog("editMember");
  };

  const onMemberDeleted = (dni: string) => {
    setMembers(prev =>
      prev.filter(m => m.DNI !== dni)
    );
    closeDialog("deleteMember");
  };

  useEffect(() => {
    if (!loading) {
      if (user?.rol !== "Administrador" || !user?.rol) {
        router.replace("/login")
      }
    }
  }, [user, loading, router])

  useEffect(() => {
    const formattedMembers: Member[] = alumnos.map(alumno => ({
      id: alumno.ID,
      Nombre: alumno.Nombre,
      DNI: alumno.DNI,
      Email: alumno.Email,
      Telefono: alumno.Telefono,
      Clases_pagadas: Number(alumno.Clases_pagadas),
      Clases_realizadas: Number(alumno.Clases_realizadas),
      Fecha_inicio: alumno.Fecha_inicio,
      Fecha_vencimiento: alumno.Fecha_vencimiento,
      Fecha_nacimiento: alumno.Fecha_nacimiento,
      Plan: alumno.Plan,
      Profesor_asignado: alumno.Profesor_asignado,
    }));

    setMembers(formattedMembers);
  }, [alumnos]);

  useEffect(() => {
    if (loading || user?.rol !== "Administrador") return
    
    async function fetchOpenCaja() {
      try {
        const hoy = format(new Date(), "d/M/yyyy")
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/caja?fecha=${hoy}`
        )
        if (!res.ok) return
        const cajas: any[] = await res.json()
        const abierta = cajas.find(c => !c["Hora Cierre"])
        if (abierta) {
          setSelectedShift(abierta.Turno)
        }
      } catch (err) {
        console.error("No pude recuperar la caja abierta:", err)
      }
    }
    fetchOpenCaja()
  }, [loading, user])

  useEffect(() => {
    refreshPayments(buildCurrentFilters())
  }, [cashOpen])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="text-lg">Cargando…</span>
      </div>
    )
  }

  if (!user || user.rol !== "Administrador") {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="text-red-600 text-center">
          No estás autorizado.<br />
          Redirigiendo al login…
        </span>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader role="Administrador" />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight gradient-text">GymSpace - Panel de administrador</h2>
        </div>
        {!cashOpen && cerrada && existe && (
          <div className="flex justify-center">
            <p className="text-lg text-red-600 mt-1 text-center p-4 bg-red-600 text-white rounded-lg">
              La caja del turno {selectedShift} ya está cerrada, cambia de turno en pagos para abrir una nueva caja.
            </p>
          </div>

        )}

        {(!cerrada || !existe) && (
          <CashRegisterSection
            cashRegisterOpen={cashOpen}
            initialAmount={initialAmount}
            selectedShift={selectedShift}
            currentShiftPayments={payments}
            onOpenCashRegister={handleOpenCashRegister}
            onCloseCashRegister={closeCash}
            setInitialAmount={setInitialAmount}
            errorMessage={cashError}
          />
        )}

        <Tabs value={tabValue} onValueChange={setTabValue} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 gap-2 h-auto md:grid-cols-9 md:w-auto">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#ff6b00] data-[state=active]:text-white">
              Resumen
            </TabsTrigger>
            <TabsTrigger value="members" className="data-[state=active]:bg-[#ff6b00] data-[state=active]:text-white">
              Miembros
            </TabsTrigger>
            <TabsTrigger value="shift-payments" className="data-[state=active]:bg-[#ff6b00] data-[state=active]:text-white">Pagos</TabsTrigger>
            <TabsTrigger value="deudas" className="data-[state=active]:bg-[#ff6b00] data-[state=active]:text-white">Deudas</TabsTrigger>
            <TabsTrigger value="assists" className="data-[state=active]:bg-[#ff6b00] data-[state=active]:text-white">Asistencias</TabsTrigger>
            <TabsTrigger value="plans" className="data-[state=active]:bg-[#ff6b00] data-[state=active]:text-white">Planes</TabsTrigger>
            <TabsTrigger value="shifts" className="data-[state=active]:bg-[#ff6b00] data-[state=active]:text-white">Turnos</TabsTrigger>
            <TabsTrigger value="egresos" className="data-[state=active]:bg-[#ff6b00] data-[state=active]:text-white">Egresos</TabsTrigger>
            <TabsTrigger value="elclub" className="data-[state=active]:bg-[#ff6b00] data-[state=active]:text-white">El Club</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" forceMount>
            <AdminOverviewCharts isVisible={tabValue === "overview"} />
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <MembersStatsTab
              members={members}
              onMemberAdded={onMemberAdded}
            />
          </TabsContent>

          <TabsContent value="shift-payments" className="space-y-4">
            <PaymentsSection
              currentShiftPayments={payments}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              selectedShift={selectedShift}
              setSelectedShift={setSelectedShift}
              onShowAddPayment={onShowAddPayment}
              setSelectedPaymentToDelete={onDeletePayment}
              setShowDeletePaymentDialog={() => { }}
              onMemberUpdated={handleMemberUpdated}
              refreshPayments={refreshPayments}
              cashOpen={cashOpen}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
            />
          </TabsContent>

          <TabsContent value="deudas" className="space-y-4">
            <DebtsSection />
          </TabsContent>

          <TabsContent value="assists" className="space-y-4">
            <AssistsSection />
          </TabsContent>

          <TabsContent value="plans" className="space-y-4">
            <PlansSection />
          </TabsContent>

          <TabsContent value="shifts" className="space-y-4">
            <ShiftsSection />
          </TabsContent>

          <TabsContent value="egresos" className="space-y-4">
            <EgresosSection />
          </TabsContent>

          <TabsContent value="elclub" className="space-y-4">
            <ElClub />
          </TabsContent>
        </Tabs>

      </div>

      <AddMemberDialog
        open={showAddMember}
        onOpenChange={setShowAddMember}
        onMemberAdded={(newMember) => {
        }}
      />

      <EditMemberDialog
        open={dialogs.editMember}
        onOpenChange={() => closeDialog("editMember")}
        member={selection.memberToEdit}
        onSave={(m: Member) => {
          updateAttendance(m.DNI, m.Clases_realizadas);
          onMemberEdited(m);
        }}
      />

      <DeleteMemberDialog
        open={dialogs.deleteMember}
        onOpenChange={() => closeDialog("deleteMember")}
        member={selection.memberToDelete!}
        onDelete={dni => {
          onMemberDeleted(dni);
        }}
      />

      <AddPaymentDialog
        open={dialogs.addPayment}
        onOpenChange={() => closeDialog("addPayment")}
        onPaymentAdded={() => refreshPayments(buildCurrentFilters())}
        onMemberUpdated={handleMemberUpdated}
        currentTurno={selectedShift}
      />

      <DeletePaymentDialog
        open={dialogs.deletePayment}
        onOpenChange={() => closeDialog("deletePayment")}
        payment={selection.paymentToDelete!}
        onDelete={() => {
          closeDialog("deletePayment")
          refreshPayments(buildCurrentFilters())
        }}
      />
    </div>
  )
}

