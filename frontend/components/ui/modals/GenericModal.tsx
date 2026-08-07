// components/ui/modals/GenericModal.tsx
import React, { ReactNode } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
} from '@mui/material';
import { FlushDialogActions } from './FlushDialogActions';

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
          overflow: 'hidden',
          '& .MuiDialogTitle-root': {
            fontSize: '1.6rem',
            fontWeight: 600,
            p: 3,
          },
          '& .MuiDialogContent-root': {
            fontSize: '1.1rem',
            lineHeight: 1.6,
            px: 3,
          },
        },
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1, pb: 2 }}>{content}</Box>
      </DialogContent>
      <FlushDialogActions
        actions={[
          { label: cancelText, onClick: onClose, tone: 'neutral' },
          { label: confirmText, onClick: onConfirm, tone: 'confirm' },
        ]}
      />
    </Dialog>

  );
};