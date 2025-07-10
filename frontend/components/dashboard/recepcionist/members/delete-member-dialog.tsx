import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { notify } from '@/lib/toast'
import axios from "axios"
import { useState } from "react"

interface DeleteMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: any
  onDelete: (deletedMemberDNI: string) => void
}

export function DeleteMemberDialog({ open, onOpenChange, member, onDelete }: DeleteMemberDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleDelete = async () => {
    setIsSubmitting(true)
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumnos/${member.DNI}`)
      onDelete(member.DNI)
      onOpenChange(false)
      notify.error("¡Alumno eliminado con éxito!")
    } catch (error) {
      notify.info("¡Alumno eliminado con éxito!")
      console.error("Error al eliminar el miembro", error)
    }
    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirmar Eliminación</DialogTitle>
          <DialogDescription>
            ¿Está seguro de que desea eliminar este usuario? Esta acción es permanente.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" disabled={isSubmitting} onClick={handleDelete}>
             {isSubmitting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
