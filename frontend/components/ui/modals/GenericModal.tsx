// components/ui/modals/GenericModal.tsx
import React, { ReactNode } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
} from '@mui/material';

interface GenericModalProps {
  open: boolean;
  title: string;
  content: ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const GenericModal: React.FC<GenericModalProps> = ({
  open,
  title,
  content,
  onClose,
  onConfirm,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          width: '700px',
          borderRadius: 1.5,
          p: 2,
          '& .MuiDialogTitle-root': {
            fontSize: '1.6rem',
            fontWeight: 600,
          },
          '& .MuiDialogContent-root': {
            fontSize: '1.1rem',
            lineHeight: 1.6,
            p: 3,
          },
          '& .MuiButton-root': {
            fontSize: '1rem',
            px: 3,
            py: 1,
          },
        },
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>{content}</Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>{cancelText}</Button>
        <Button variant="contained" onClick={onConfirm}>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>

  );
};