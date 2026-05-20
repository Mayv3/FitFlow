"use client"

import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import { useQueryClient } from "@tanstack/react-query"
import { CreateGym } from "@/components/owner/CreateGym"

interface Props {
  open: boolean
  onClose: () => void
}

export function CreateGymModal({ open, onClose }: Props) {
  const qc = useQueryClient()
  const handleClose = () => {
    qc.invalidateQueries({ queryKey: ["gyms"] })
    onClose()
  }
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1 }}>
        <Box>Crear gimnasio</Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <CreateGym />
      </DialogContent>
    </Dialog>
  )
}
