'use client'

import { useState, useEffect } from 'react'
import {
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CancelIcon from '@mui/icons-material/Cancel'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import CloseIcon from '@mui/icons-material/Close'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import StarIcon from '@mui/icons-material/Star'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import { useSubscription } from '@/context/SubscriptionContext'
import { useDarkMode } from '@/context/DarkModeContext'

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Sin fecha'
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

type StatusType = 'active' | 'expiring' | 'expired' | 'payment-warning' | 'none'

function getStatus(
  isActive: boolean,
  isExpiring: boolean,
  days: number | null,
  isPaymentWarning: boolean
): StatusType {
  if (isPaymentWarning) return 'payment-warning'
  if (!isActive) return 'none'
  if (days !== null && days <= 0) return 'expired'
  if (isExpiring) return 'expiring'
  return 'active'
}

const STATUS_CONFIG: Record<
  StatusType,
  {
    label: string
    color: 'success' | 'warning' | 'error' | 'default'
    icon: React.ReactElement
    description: string
  }
> = {
  active: {
    label: 'Activo',
    color: 'success',
    icon: <CheckCircleIcon fontSize="small" />,
    description: 'Tu suscripción está activa y al día.',
  },
  expiring: {
    label: 'Por vencer',
    color: 'warning',
    icon: <WarningAmberIcon fontSize="small" />,
    description: 'Tu suscripción está próxima a vencer. Renovála para no perder acceso.',
  },
  'payment-warning': {
    label: 'Pago pendiente',
    color: 'warning',
    icon: <WarningAmberIcon fontSize="small" />,
    description: 'Tu suscripción venció. Tenés hasta el día 15 de este mes para regularizar el pago, caso contrario se suspenderá el acceso al sistema.',
  },
  expired: {
    label: 'Vencida',
    color: 'error',
    icon: <CancelIcon fontSize="small" />,
    description: 'Tu suscripción ha vencido. Contactá soporte para renovar. Mail: contactofitnessflow@gmail.com',
  },
  none: {
    label: 'Sin plan',
    color: 'default',
    icon: <HelpOutlineIcon fontSize="small" />,
    description: 'No tenés una suscripción activa. Contactá soporte para activar un plan.',
  },
}

export const SubscriptionStatusBadge = () => {
  const [open, setOpen] = useState(false)
  const {
    isSubscriptionActive,
    isExpiringSoon,
    daysUntilExpiration,
    planName,
    subscriptionData,
    isSubscriptionLoading,
    isPaymentWarning,
  } = useSubscription()

  const { isDarkMode, toggleDarkMode } = useDarkMode()

  const status = getStatus(isSubscriptionActive, isExpiringSoon, daysUntilExpiration, isPaymentWarning)

  // Auto-abrir el modal si el plan está vencido, sin plan, o en aviso de pago pendiente
  useEffect(() => {
    if (!isSubscriptionLoading && (status === 'expired' || status === 'none' || status === 'payment-warning')) {
      setOpen(true)
    }
  }, [isSubscriptionLoading, status])

  if (isSubscriptionLoading) return null

  const config = STATUS_CONFIG[status]
  const subscription = subscriptionData?.subscription
  const plan = subscriptionData?.plan

  return (
    <>
      {/* Badge + toggle de tema — fixed arriba a la derecha */}
      <Box
        sx={{
          position: 'fixed',
          top: 12,
          right: 16,
          zIndex: 1400,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Chip
          icon={config.icon}
          label={config.label}
          color={config.color}
          size="medium"
          onClick={() => setOpen(true)}
          sx={(theme) => ({
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.75rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            },
            animation: status === 'expiring' || status === 'expired' || status === 'payment-warning'
              ? 'pulse-badge 2s infinite'
              : 'none',
            '@keyframes pulse-badge': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.7 },
            },
            ...(theme.palette.mode === 'dark' && {
              '& .MuiChip-label': { color: '#fff' },
              '& .MuiChip-icon': { color: '#fff' },
            }),
          })}
        />
        <Tooltip title={isDarkMode ? 'Modo claro' : 'Modo oscuro'}>
          <IconButton
            onClick={toggleDarkMode}
            size="small"
            sx={(theme) => ({
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.14)',
              },
            })}
          >
            {isDarkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Dialog con detalle de la suscripción */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
          },
        }}
      >
        {/* Header coloreado */}
        <Box
          sx={{
            background:
              status === 'active'
                ? 'linear-gradient(135deg, #43a047, #66bb6a)'
                : status === 'expiring' || status === 'payment-warning'
                ? 'linear-gradient(135deg, #f9a825, #ffca28)'
                : status === 'expired'
                ? 'linear-gradient(135deg, #e53935, #ef5350)'
                : 'linear-gradient(135deg, #757575, #9e9e9e)',
            color: '#fff',
            px: 3,
            py: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {config.icon}
            <Typography variant="h6" fontWeight={700}>
              Estado del sistema
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ pt: 3, pb: 1 }}>
          {/* Estado */}
          <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <Chip
              icon={config.icon}
              label={config.label}
              color={config.color}
              sx={(theme) => ({
                fontWeight: 700,
                fontSize: '0.85rem',
                mb: 1,
                ...(theme.palette.mode === 'dark' && {
                  '& .MuiChip-label': { color: '#fff' },
                  '& .MuiChip-icon': { color: '#fff' },
                }),
              })}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {config.description}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Plan */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <StarIcon fontSize="small" color="success" />
            <Typography variant="body2" fontWeight={600}>
              Plan:
            </Typography>
            <Typography variant="body2">
              {planName ?? 'Sin plan asignado'}
            </Typography>
          </Box>

          {/* Máx alumnos */}
          {plan?.max_alumnos !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Typography variant="body2" fontWeight={600} sx={{ ml: 3.5 }}>
                Máx. alumnos:
              </Typography>
              <Typography variant="body2">
                {plan.max_alumnos}
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Fecha inicio */}
          {subscription?.start_at && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <CalendarTodayIcon fontSize="small" color="action" />
              <Typography variant="body2" fontWeight={600}>
                Inicio:
              </Typography>
              <Typography variant="body2">
                {formatDate(subscription.start_at)}
              </Typography>
            </Box>
          )}

          {/* Fecha vencimiento */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <CalendarTodayIcon fontSize="small" color={status === 'expired' ? 'error' : 'action'} />
            <Typography variant="body2" fontWeight={600}>
              Vencimiento:
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color:
                  status === 'expired'
                    ? 'error.main'
                    : status === 'expiring'
                    ? 'warning.main'
                    : 'text.primary',
                fontWeight: status !== 'active' ? 700 : 400,
              }}
            >
              {formatDate(subscription?.end_at)}
            </Typography>
          </Box>

          {/* Días restantes */}
          {daysUntilExpiration !== null && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="body2" fontWeight={600} sx={{ ml: 3.5 }}>
                {daysUntilExpiration > 0
                  ? `Quedan ${daysUntilExpiration} día${daysUntilExpiration !== 1 ? 's' : ''}`
                  : daysUntilExpiration === 0
                  ? 'Vence hoy'
                  : `Venció hace ${Math.abs(daysUntilExpiration)} día${Math.abs(daysUntilExpiration) !== 1 ? 's' : ''}`}
              </Typography>
            </Box>
          )}

          {/* Recordatorio de pago */}
          <Divider sx={{ my: 2 }} />
          <Box
            sx={{
              backgroundColor: 'success.main',
              opacity: 0.9,
              borderRadius: 2,
              px: 2,
              py: 1.5,
              mb: 1,
            }}
          >
            <Typography variant="body2" fontWeight={600} sx={{ color: '#fff' }}>
              Recordatorio de pago
            </Typography>
            <Typography variant="body2" sx={{ color: '#fff', mt: 0.5 }}>
              El período de pago es del <strong>1 al 15 de cada mes</strong>. Asegurate de abonar dentro de ese plazo para mantener el acceso al sistema.
            </Typography>
          </Box>

          {/* Features del plan */}
          {plan && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                Funcionalidades incluidas:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {plan.stats && <Chip label="Estadísticas" size="small" variant="outlined" color="success" />}
                {plan.classes && <Chip label="Clases" size="small" variant="outlined" color="success" />}
                {plan.services && <Chip label="Servicios" size="small" variant="outlined" color="success" />}
                {plan.appointments && <Chip label="Turnos" size="small" variant="outlined" color="success" />}
                {plan.portal && <Chip label="Portal" size="small" variant="outlined" color="success" />}
                {plan.settings && <Chip label="Configuración" size="small" variant="outlined" color="success" />}
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} variant="outlined" size="small" color='success'>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
