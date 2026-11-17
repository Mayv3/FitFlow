'use client';
import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, TextField, Box } from '@mui/material';
import { FlushDialogActions } from '@/components/ui/modals/FlushDialogActions';
import { useValidateDniFromApi } from '@/hooks/validatorsInput/useValidateDni';
import { useCambiarDniAlumno } from '@/hooks/alumnos/useAlumnosApi';
import { getApiErrorMessage } from '@/utils/errors/apiError';

type Props = {
  open: boolean;
  dniActual: string;
  onClose: () => void;
  onChanged: (nuevoDni: string) => void;
};

const DNI_REGEX = /^\d{7,8}$/;

/**
 * Cambio de DNI: abre directo en el campo del DNI nuevo.
 * El chequeo en vivo avisa antes de guardar; el backend vuelve a validar
 * (incluye alumnos eliminados, que el chequeo en vivo no ve).
 */
export function CambiarDniDialog({ open, dniActual, onClose, onChanged }: Props) {
  const [nuevoDni, setNuevoDni] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [chequeando, setChequeando] = useState(false);
  const validarDni = useValidateDniFromApi();
  const cambiarDni = useCambiarDniAlumno();

  // Cada apertura arranca de cero.
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNuevoDni('');
    setError(null);
  }, [open]);

  // Chequeo en vivo, con debounce, solo cuando el formato ya es válido.
  useEffect(() => {
    if (!DNI_REGEX.test(nuevoDni) || nuevoDni === dniActual) return;
    let vigente = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChequeando(true);
    const t = setTimeout(async () => {
      const msg = await validarDni(nuevoDni);
      if (!vigente) return;
      setError(msg);
      setChequeando(false);
    }, 400);
    return () => { vigente = false; clearTimeout(t); setChequeando(false); };
  }, [nuevoDni, dniActual, validarDni]);

  const handleChange = (value: string) => {
    if (!/^\d*$/.test(value) || value.length > 8) return;
    setNuevoDni(value);
    setError(value === dniActual ? 'Es el mismo DNI que ya tiene' : null);
  };

  const handleGuardar = () => {
    cambiarDni.mutate(
      { dni: dniActual, nuevoDni },
      {
        onSuccess: () => onChanged(nuevoDni),
        onError: (e) => setError(getApiErrorMessage(e) || 'No se pudo cambiar el DNI'),
      }
    );
  };

  const puedeGuardar = DNI_REGEX.test(nuevoDni) && !error && !chequeando && !cambiarDni.isPending;

  return (
    <Dialog
      open={open}
      onClose={cambiarDni.isPending ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 1.5, overflow: 'hidden' } }}
    >
      <DialogTitle sx={{ fontWeight: 600 }}>Nuevo DNI</DialogTitle>
      <DialogContent>
        <Box
          component="form"
          sx={{ pt: 1 }}
          onSubmit={(e) => { e.preventDefault(); if (puedeGuardar) handleGuardar(); }}
        >
          <TextField
            autoFocus
            fullWidth
            label="Nuevo DNI"
            placeholder="7 u 8 dígitos"
            value={nuevoDni}
            onChange={(e) => handleChange(e.target.value)}
            error={!!error}
            helperText={error ?? (chequeando ? 'Verificando…' : `DNI actual: ${dniActual}`)}
            slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 8 } }}
          />
        </Box>
      </DialogContent>
      <FlushDialogActions
        actions={[
          { label: 'Cancelar', onClick: onClose, tone: 'neutral', disabled: cambiarDni.isPending },
          {
            label: 'Guardar',
            onClick: handleGuardar,
            tone: 'confirm',
            disabled: !puedeGuardar,
            loading: cambiarDni.isPending,
          },
        ]}
      />
    </Dialog>
  );
}
