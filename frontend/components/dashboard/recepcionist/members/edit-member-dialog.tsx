"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/dashboard/date-picker"
import { format } from "date-fns"
import { useAppData } from "@/context/AppDataContext"
import { notify } from '@/lib/toast'

import axios from "axios"
import { FormEnterToTab } from "@/components/FormEnterToTab"

export function EditMemberDialog({ open, onOpenChange, member, onSave }: any) {
  const [editedMember, setEditedMember] = useState(member || {})
  const [tipoSeleccionado, setTipoSeleccionado] = useState("")
  const [planSeleccionado, setPlanSeleccionado] = useState<any>(null)
  const { planes } = useAppData();
  const [isSubmitting, setIsSubmitting] = useState(false)

  const parseDate = (dateStr: string): Date | null => {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return new Date(Number(year), Number(month) - 1, Number(day))
    }
    return null
  }

  useEffect(() => {
    if (member) {
      const converted = { ...member }
      if (converted.Fecha_nacimiento?.includes("-")) {
        const [year, month, day] = converted.Fecha_nacimiento.split("-")
        converted.Fecha_nacimiento = `${day}/${month}/${year}`
      }
      setEditedMember(converted)
    }
  }, [member])

  const tiposUnicos = [...new Set(planes.map(p => p.Tipo))]
  const planesFiltrados = planes.filter(p => p.Tipo === tipoSeleccionado)

  const handleChange = (field: string, value: string) => {
    setEditedMember((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSelectPlan = (planID: string) => {
    const selected = planes.find(p => p.ID === planID)
    setPlanSeleccionado(selected)
    if (selected) {
      handleChange("Plan", selected["Plan o Producto"])
      handleChange("Clases_pagadas", String(selected.numero_Clases))
    }
  }

  const handleSave = async () => {
    setIsSubmitting(true)
    const payload = { ...editedMember }
    if (payload.Fecha_nacimiento?.includes("/")) {
      const [day, month, year] = payload.Fecha_nacimiento.split("/")
      payload.Fecha_nacimiento = `${day}/${month}/${year}`
    }
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumnos/${payload.DNI}`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      )
      onSave(payload)
      onOpenChange(false)
      notify.success("¡Alumno editado con éxito!")
    } catch (error) {
      console.error("Error actualizando el miembro", error)
    }
    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Editar Miembro</DialogTitle>
          <DialogDescription>Modifica la información del socio.</DialogDescription>
        </DialogHeader>

        <FormEnterToTab onSubmit={(e) => {
          e.preventDefault();
          handleSave()
        }}>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="Nombre">Nombre</Label>
                <Input required capitalizeFirst id="Nombre" value={editedMember.Nombre || ""} onChange={(e) => handleChange("Nombre", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="DNI">DNI</Label>
                <Input id="DNI" value={editedMember.DNI || ""} disabled />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="Email">Email</Label>
                <Input required id="Email" value={editedMember.Email || ""} onChange={(e) => handleChange("Email", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="Telefono">Teléfono</Label>
                <Input required id="Telefono" value={editedMember.Telefono || ""} onChange={(e) => handleChange("Telefono", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="Sexo">Sexo</Label>
                <Select value={editedMember.Sexo || ""} onValueChange={(value) => handleChange("Sexo", value)}>
                  <SelectTrigger id="Sexo">
                    <SelectValue placeholder="Seleccionar sexo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Femenino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="Clases_pagadas">Clases Pagadas</Label>
                <Input required id="Clases_pagadas" value={editedMember.Clases_pagadas || ""} onChange={(e) => handleChange("Clases_pagadas", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="Clases_realizadas">Clases Realizadas</Label>
                <Input required id="Clases_realizadas" value={editedMember.Clases_realizadas || ""} onChange={(e) => handleChange("Clases_realizadas", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="GymCoins">GymCoins</Label>
                <Input
                  id="GymCoins"
                  type="number"
                  min={0}
                  value={editedMember.GymCoins !== undefined ? editedMember.GymCoins : 0}
                  required
                  onChange={(e) => handleChange("GymCoins", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Inicio</Label>
                <DatePicker
                  date={editedMember.Fecha_inicio ? parseDate(editedMember.Fecha_inicio) || new Date() : new Date()}
                  setDate={(newDate: Date) => handleChange("Fecha_inicio", format(newDate, "dd/MM/yyyy"))}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha de Vencimiento</Label>
                <DatePicker
                  date={editedMember.Fecha_vencimiento ? parseDate(editedMember.Fecha_vencimiento) || undefined : new Date()}
                  setDate={(newDate: Date) => handleChange("Fecha_vencimiento", format(newDate, "dd/MM/yyyy"))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="Fecha_nacimiento">Fecha de Nacimiento</Label>
                <Input id="Fecha_nacimiento" value={editedMember.Fecha_nacimiento || ""} onChange={(e) => handleChange("Fecha_nacimiento", e.target.value)} pattern="^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/\d{4}$" title="El formato debe ser dd/mm/aaaa" />
              </div>
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

            <div className="space-y-2">
              <Label htmlFor="Profesor_asignado">Profesor Asignado</Label>
              <Input capitalizeFirst id="Profesor_asignado" value={editedMember.Profesor_asignado || ""} onChange={(e) => handleChange("Profesor_asignado", e.target.value)} />
            </div>

            <div className="flex justify-end">
              <Button type="submit" variant="orange" disabled={isSubmitting}>
                {isSubmitting ? "Guardando cambios..." : "Guardar cambios"}
              </Button>
            </div>
          </div>
        </FormEnterToTab>
      </DialogContent>
    </Dialog>
  )
}
