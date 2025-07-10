// hooks/useDialogManager.ts
import { useState, useCallback } from "react"
import { Member, Payment } from "@/models/dashboard"

export type DialogsState = {
  addMember: boolean
  editMember: boolean
  deleteMember: boolean
  addPayment: boolean
  deletePayment: boolean
}

export type SelectionState = {
  memberToEdit: Member | null
  memberToDelete: Member | null
  paymentToDelete: Payment | null
}

/**
 * Hook para centralizar la lógica de abrir/cerrar diálogos
 * y seleccionar el elemento a editar/borrar.
 *
 * @param cashRegisterOpen  controla si se permite mostrar el diálogo de "addPayment"
 */
export function useDialogManager(cashRegisterOpen: boolean) {
  const [dialogs, setDialogs] = useState<DialogsState>({
    addMember: false,
    editMember: false,
    deleteMember: false,
    addPayment: false,
    deletePayment: false,
  })

  const [selection, setSelection] = useState<SelectionState>({
    memberToEdit: null,
    memberToDelete: null,
    paymentToDelete: null,
  })

  const openDialog = useCallback((name: keyof DialogsState) => {
    setDialogs(d => ({ ...d, [name]: true }))
  }, [])

  const closeDialog = useCallback((name: keyof DialogsState) => {
    setDialogs(d => ({ ...d, [name]: false }))
  }, [])

  const onEditMember = useCallback((member: Member) => {
    setSelection(s => ({ ...s, memberToEdit: member }))
    openDialog("editMember")
  }, [openDialog])

  const onDeleteMember = useCallback((member: Member) => {
    setSelection(s => ({ ...s, memberToDelete: member }))
    openDialog("deleteMember")
  }, [openDialog])

  const onDeletePayment = useCallback((payment: Payment) => {
    setSelection(s => ({ ...s, paymentToDelete: payment }))
    openDialog("deletePayment")
  }, [openDialog])

  const onShowAddPayment = useCallback(() => {
    if (cashRegisterOpen) {
      openDialog("addPayment")
    }
  }, [cashRegisterOpen, openDialog])

  return {
    dialogs,
    selection,
    openDialog,
    closeDialog,
    onEditMember,
    onDeleteMember,
    onDeletePayment,
    onShowAddPayment,
  }
}
