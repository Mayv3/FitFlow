'use client';
import React from 'react';
import { Box, Button, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export type FlushAction = {
  label: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  /** neutral = se funde con el fondo del modal, confirm = color primario, danger = color de error. */
  tone?: 'neutral' | 'confirm' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  /** Override puntual (ej. el color ambar de "upgrade a premium") por encima del tone. */
  sx?: Record<string, unknown>;
};

/**
 * Franja de acciones pegada al borde inferior del modal: sin padding ni gap,
 * cada boton ocupa una fraccion igual del ancho (como el ejemplo Cancelar/Guardar
 * pedido por el usuario). El Dialog que la contiene necesita
 * `PaperProps={{ sx: { overflow: 'hidden' } }}` para que las esquinas de abajo
 * hereden el radio del modal en vez de quedar cuadradas.
 */
export function FlushDialogActions({ actions }: { actions: FlushAction[] }) {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', borderTop: `1px solid ${theme.palette.divider}` }}>
      {actions.map((action, i) => (
        <Button
          key={i}
          type={action.type ?? 'button'}
          onClick={action.onClick}
          disabled={action.disabled || action.loading}
          disableElevation
          sx={{
            flex: 1,
            borderRadius: 0,
            py: 2,
            fontWeight: 700,
            fontSize: '0.95rem',
            textTransform: 'none',
            ...(action.tone === 'confirm' && {
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': { bgcolor: 'primary.dark' },
              '&.Mui-disabled': {
                bgcolor: theme.palette.action.disabledBackground,
                color: theme.palette.action.disabled,
              },
            }),
            ...(action.tone === 'danger' && {
              bgcolor: 'error.main',
              color: 'error.contrastText',
              '&:hover': { bgcolor: 'error.dark' },
            }),
            ...((!action.tone || action.tone === 'neutral') && {
              bgcolor: 'transparent',
              color: 'text.primary',
              '&:hover': { bgcolor: theme.palette.action.hover },
            }),
            ...action.sx,
          }}
        >
          {action.loading ? <CircularProgress size={22} color="inherit" /> : action.label}
        </Button>
      ))}
    </Box>
  );
}
