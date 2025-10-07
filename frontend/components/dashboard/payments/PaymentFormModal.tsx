'use client';

import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { PaymentForm } from './PaymentForm';

export function PaymentFormModal({
  open,
  onClose,
  onSubmit,
  planOptions,
  alumnoOptions,
  defaultValues,
  mode = 'create',
}: any) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{mode === 'edit' ? 'Editar pago' : 'Registrar nuevo pago'}</DialogTitle>
      <DialogContent>
        <PaymentForm
          planOptions={planOptions}
          alumnoOptions={alumnoOptions}
          defaultValues={defaultValues}
          onSubmit={onSubmit}
          mode={mode}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
      </DialogActions>
    </Dialog>
  );
}
