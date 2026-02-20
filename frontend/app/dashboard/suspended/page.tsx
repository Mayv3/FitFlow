'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  Chip,
} from '@mui/material'
import BlockIcon from '@mui/icons-material/Block'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import EmailIcon from '@mui/icons-material/Email'
import LockIcon from '@mui/icons-material/Lock'
import StorefrontIcon from '@mui/icons-material/Storefront'
import StarIcon from '@mui/icons-material/Star'
import Cookies from 'js-cookie'
import { useSubscription } from '@/context/SubscriptionContext'
import { useLogout } from '@/hooks/logout/useLogout'

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Sin fecha'
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export default function SuspendedPage() {
  const [gymName, setGymName] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const logout = useLogout()

  const {
    subscriptionData,
    daysUntilExpiration,
    planName,
    isSubscriptionLoading,
  } = useSubscription()

  useEffect(() => {
    setGymName(Cookies.get('gym_name') || 'Tu gimnasio')
    setUserEmail(Cookies.get('email') || '')
  }, [])

  const subscription = subscriptionData?.subscription
  const daysOverdue = daysUntilExpiration !== null ? Math.abs(daysUntilExpiration) : null

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        p: 2,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          maxWidth: 520,
          width: '100%',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        {/* Header rojo */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #c62828, #e53935)',
            color: '#fff',
            px: 4,
            py: 4,
            textAlign: 'center',
          }}
        >
          <BlockIcon sx={{ fontSize: 60, mb: 1, opacity: 0.9 }} />
          <Typography variant="h5" fontWeight={800}>
            Acceso suspendido
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
            El sistema se encuentra temporalmente inhabilitado
          </Typography>
        </Box>

        {/* Contenido */}
        <Box sx={{ px: 4, py: 3 }}>
          {/* Info del gimnasio */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <StorefrontIcon color="primary" />
            <Box>
              <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
                Gimnasio
              </Typography>
              <Typography variant="body1" fontWeight={700}>
                {gymName}
              </Typography>
            </Box>
          </Box>

          {/* Plan */}
          {planName && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <StarIcon color="primary" />
              <Box>
                <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
                  Plan
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {planName}
                </Typography>
              </Box>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Fecha vencimiento */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <CalendarTodayIcon color="error" />
            <Box>
              <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
                Fecha de vencimiento
              </Typography>
              <Typography variant="body1" fontWeight={700} color="error.main">
                {formatDate(subscription?.end_at)}
              </Typography>
            </Box>
          </Box>

          {/* Días vencido */}
          {daysOverdue !== null && (
            <Box sx={{ mb: 2, textAlign: 'center' }}>
              <Chip
                icon={<LockIcon />}
                label={`Venció hace ${daysOverdue} día${daysOverdue !== 1 ? 's' : ''}`}
                color="error"
                sx={{ fontWeight: 700, fontSize: '0.85rem' }}
              />
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Mensaje */}
          <Box
            sx={{
              backgroundColor: 'error.main',
              borderRadius: 2,
              px: 2.5,
              py: 2,
              mb: 2,
              opacity: 0.95,
            }}
          >
            <Typography variant="body2" fontWeight={600} color="error.contrastText" sx={{ mb: 0.5 }}>
              ¿Por qué no puedo acceder?
            </Typography>
            <Typography variant="body2" color="error.contrastText" fontSize="0.8rem">
              El plazo de pago (del 1 al 15 de cada mes) ha finalizado sin que se registre el pago correspondiente.
              El acceso al sistema queda suspendido hasta que se regularice el pago.
            </Typography>
            <Typography variant="body2" color="error.contrastText" fontSize="0.8rem" sx={{ mt: 1 }}>
              <strong>Tus datos están guardados y seguros</strong>, pero no podrás acceder a ellos
              hasta que tu suscripción se encuentre al día.
            </Typography>
          </Box>

          {/* Contacto */}
          <Box
            sx={{
              borderRadius: 2,
              px: 2.5,
              py: 2,
              mb: 2,
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
              Para regularizar tu situación contactanos:
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<EmailIcon />}
              onClick={() =>
                window.open(
                  `mailto:contactofitnessflow@gmail.com?subject=Regularizar suscripción - ${gymName}&body=Hola, mi gimnasio "${gymName}" (${userEmail}) necesita regularizar su suscripción.`,
                  '_blank'
                )
              }
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              contactofitnessflow@gmail.com
            </Button>
          </Box>

          {/* Botón cerrar sesión */}
          <Button
            fullWidth
            variant="outlined"
            color="inherit"
            onClick={logout}
            sx={{
              mt: 1,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Cerrar sesión
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}
