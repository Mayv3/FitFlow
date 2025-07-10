"use client"
import React, { use, useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash } from "lucide-react"
import { notify } from "@/lib/toast"

interface DeletePaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payment: any
  onDelete: (deletedPaymentId: string) => void
}

export function DeletePaymentDialog({ open, onOpenChange, payment, onDelete }: DeletePaymentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleDelete = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pagos/${payment.ID}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Error al eliminar el pago")
      onDelete(payment.ID)
      onOpenChange(false)
      notify.info("¡Pago eliminado con éxito!")
    } catch (error) {
      console.error("Error deleting payment:", error)
    }
    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Trash className="mr-2 h-5 w-5 text-destructive" />
            Eliminar Pago
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro de eliminar el pago registrado para <strong>{payment?.Nombre}</strong>? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" disabled={isSubmitting} onClick={() => {
            handleDelete();
          }}>
            {isSubmitting ? "Eliminando..." : "Eliminar pago"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
