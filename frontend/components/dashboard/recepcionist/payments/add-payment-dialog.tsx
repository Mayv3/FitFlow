"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useAppData } from "@/context/AppDataContext"
import { parse, format, addMonths } from "date-fns"
import { useUser } from "@/context/UserContext"
import axios from "axios"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import { CreditCard, DollarSign } from "lucide-react"
import { DatePicker } from "../../date-picker"
import { notify } from '@/lib/toast'
import { FormEnterToTab } from "@/components/FormEnterToTab"

interface AddPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPaymentAdded: () => void
  onMemberUpdated: (dni: string, nuevaFecha: string, plan: string, numeroClases: number) => void
  currentTurno: string
}

export function AddPaymentDialog({ open, onOpenChange, onPaymentAdded, onMemberUpdated, currentTurno, }: AddPaymentDialogProps) {

  const [dniError, setDniError] = useState("")
  const [tipoSeleccionado, setTipoSeleccionado] = useState("")
  const [planSeleccionado, setPlanSeleccionado] = useState<any>(null)
  const { planes } = useAppData()
  const { user } = useUser()
  const { alumnos } = useAppData()
  const [formData, setFormData] = useState({
    dni: "",
    name: "",
    amount: "",
    method: "",
    concept: "",
    paymentDate: format(new Date(), "yyyy-MM-dd"),
    expirationDate: "",
    responsable: user?.nombre,
    turno: ""
  })
  const tiposUnicos = [...new Set(planes.map(p => p.Tipo))]
  const planesFiltrados = planes.filter(p => p.Tipo === tipoSeleccionado)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSelectPlan = (planID: string) => {
    const selected = planes.find(p => p.ID === planID)
    setPlanSeleccionado(selected)
    handleChange("amount", selected?.Precio || "")
    handleChange("concept", selected?.["Plan o Producto"] || "")
  }

  const dniInputRef = useRef<HTMLInputElement>(null)

  const handleDniBlur = async () => {
    const dni = dniInputRef.current?.value || ""
    const alumno = alumnos.find(a => a.DNI === dni)

    if (alumno) {
      setFormData(prev => ({ ...prev, dni, name: alumno.Nombre }))
      let mensaje = `Fecha de vencimiento: ${alumno.Fecha_vencimiento}`

      try {

        if(!dni){
          return;
        }

        const { data } = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/deudas/alumno/${dni}`)


        const deudaAlumno = data.detalle.filter(
          (d: any) => d.Tipo === "El alumno le debe al gimnasio" && d.Estado === "No pagado"
        )
        const deudaGimnasio = data.detalle.filter(
          (d: any) => d.Tipo === "El gimnasio le debe al alumno" && d.Estado === "No pagado"
        )

        if (deudaAlumno.length > 0) {
          const total = deudaAlumno.reduce((acc: number, d: any) => acc + Number(d.Monto || 0), 0)
          mensaje += ` | 💰 Deuda pendiente: $${total}`
        }

        if (deudaGimnasio.length > 0) {
          const aFavor = deudaGimnasio.reduce((acc: number, d: any) => acc + Number(d.Monto || 0), 0)
          mensaje += ` | 🟢 A favor del alumno: $${aFavor}`
        }

        if (deudaAlumno.length === 0 && deudaGimnasio.length === 0) {
          mensaje += " | ✅ Sin deudas"
        }

      } catch (error) {
        console.error("Error al consultar deuda del alumno:", error)
        mensaje += " | ⚠️ Error al verificar deudas"
      }

      setDniError(mensaje)
    } else if (dni.length >= 6) {
      setFormData(prev => ({ ...prev, dni, name: "" }))
      setDniError("No se encontró un alumno con ese DNI")
    } else {
      setFormData(prev => ({ ...prev, dni, name: "" }))
      setDniError("")
    }
  }

  const handleDateChange = (field: "paymentDate" | "expirationDate", date: Date | undefined) => {
    if (!date) return
    const formattedDate = format(date, "yyyy-MM-dd")
    setFormData((prev) => ({ ...prev, [field]: formattedDate }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.amount || !formData.method || !formData.concept || !formData.paymentDate || !formData.expirationDate || !formData.responsable || !formData.turno) {
      notify.error("Por favor completa todos los campos antes de enviar.");
      return;
    }

    setIsSubmitting(true)

    const fields = Object.values(formData)
    if (fields.some(f => f.trim() === "")) {
      alert("Todos los campos son obligatorios")
      return
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pagos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "Socio DNI": formData.dni,
          "Nombre": formData.name,
          "Monto": formData.amount,
          "Método de Pago": formData.method,
          "Fecha de Pago": formData.paymentDate,
          "Fecha de Vencimiento": formData.expirationDate,
          "Responsable": user?.nombre,
          "Turno": formData.turno,
          "Tipo": tipoSeleccionado,
          "Ultimo_Plan": planSeleccionado?.["Plan o Producto"] || "",
        }),
      })

      if (!res.ok) throw new Error("Error al registrar el pago")

      const parsedDate = parse(formData.expirationDate, "yyyy-MM-dd", new Date())
      const expirationDateFormatted = format(parsedDate, "dd/MM/yyyy")

      if (tipoSeleccionado === "GIMNASIO" || tipoSeleccionado === "CLASE") {
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumnos/${formData.dni}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Fecha_vencimiento: expirationDateFormatted,
            Plan: planSeleccionado?.["Plan o Producto"] || "",
            Clases_pagadas: parseInt(planSeleccionado?.numero_Clases || "0"),
            Clases_realizadas: "0"
          })
        })

        onMemberUpdated(
          formData.dni,
          expirationDateFormatted,
          planSeleccionado?.["Plan o Producto"] || "",
          parseInt(planSeleccionado?.numero_Clases || "0")
        )
      }

      onPaymentAdded()
      notify.success("¡Pago cargado con éxito!")
      setFormData({
        dni: "",
        name: "",
        amount: "",
        method: "",
        concept: "",
        paymentDate: format(new Date(), "yyyy-MM-dd"),
        expirationDate: "",
        responsable: user?.nombre || "",
        turno: ""
      })
      setTipoSeleccionado("")
      setPlanSeleccionado(null)

    } catch (error) {
      notify.error("¡Error al registrar el pago")
      console.error("Error al enviar el pago:", error)
    }
    setIsSubmitting(false)
    onOpenChange(false)
  }

  useEffect(() => {
    if (user?.nombre) {
      setFormData((prev) => ({ ...prev, responsable: user.nombre }))
    }
  }, [user])

  useEffect(() => {
    if (open) {
      setFormData(prev => ({
        ...prev,
        turno: currentTurno,
        expirationDate: prev.expirationDate || format(addMonths(new Date(), 1), "yyyy-MM-dd"),
      }))
    }
  }, [open])

  useEffect(() => {
    if (!formData.paymentDate) return
    const nuevaExp = format(
      addMonths(parseLocalYMD(formData.paymentDate), 1),
      "yyyy-MM-dd"
    )
    setFormData(prev => ({ ...prev, expirationDate: nuevaExp }))
  }, [formData.paymentDate])

  const parseLocalYMD = (str: string): Date => {
    const [y, m, d] = str.split("-")
    return new Date(Number(y), Number(m) - 1, Number(d))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[500px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CreditCard className="mr-2 h-5 w-5 text-primary" />
            Registrar Nuevo Pago
          </DialogTitle>
          <DialogDescription>Completa el formulario para registrar un nuevo pago en el sistema.</DialogDescription>
        </DialogHeader>
        <FormEnterToTab onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dni">DNI del Miembro</Label>
              <Input
                id="dni"
                type="number"
                placeholder="Ingrese el DNI del socio"
                ref={dniInputRef}
                defaultValue={formData.dni}
                onBlur={handleDniBlur}
                required
              />
              {dniError && <p className="text-sm text-red-600">{dniError}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Plan</Label>
                <Select value={tipoSeleccionado} onValueChange={setTipoSeleccionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposUnicos.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={planSeleccionado?.ID || ""} onValueChange={handleSelectPlan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {planesFiltrados.map((plan) => (
                      <SelectItem key={plan.ID} value={plan.ID}>{plan["Plan o Producto"]} - {plan.numero_Clases} clases</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="amount" type="number" min="0" placeholder="0.00" className="pl-8" value={formData.amount} onChange={(e) => handleChange("amount", e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Método de Pago</Label>
              <Select required value={formData.method} onValueChange={(value) => handleChange("method", value)}>
                <SelectTrigger id="method">
                  <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Efectivo">Efectivo</SelectItem>
                  <SelectItem value="Tarjeta">Mercado Pago - otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentDate">Fecha de Pago</Label>
                <DatePicker
                  disabled
                  date={
                    formData.paymentDate
                      ? parseLocalYMD(formData.paymentDate)
                      : new Date()
                  }
                  setDate={(date) => handleDateChange("paymentDate", date)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expirationDate">Fecha de Vencimiento</Label>
                <DatePicker
                  date={
                    formData.expirationDate
                      ? parseLocalYMD(formData.expirationDate)
                      : new Date(
                        new Date().getFullYear(),
                        new Date().getMonth() + 1,
                        new Date().getDate()
                      )
                  }
                  setDate={(date) => handleDateChange("expirationDate", date)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="turno">Turno</Label>
              <Input value={formData.turno} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="responsable">Responsable</Label>
              <Input
                id="responsable"
                placeholder="Nombre del recepcionista"
                value={user?.nombre}
                disabled
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="orange" disabled={isSubmitting} type="submit">
                {isSubmitting ? "Registrando pago..." : 'Registrar pago'}
              </Button>
            </motion.div>
          </DialogFooter>
        </FormEnterToTab>
      </DialogContent>
    </Dialog>
  )
}