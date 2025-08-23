'use client'

import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import PaymentIcon from '@mui/icons-material/Payments'
import { usePaymentsStats } from '@/hooks/stats/usePaymentsStats'

export const PaymentMethodsStatCard = ({ gymId }: { gymId?: string }) => {
  const theme = useTheme()
  const { data, isLoading } = usePaymentsStats(gymId)

  if (isLoading || !data) {
    return (
      <Box p={2} borderRadius={2} boxShadow={1} bgcolor="background.paper">
        <Typography variant="body2">Cargando métodos de pago…</Typography>
      </Box>
    )
  }

  const total = data.totalPagos || 1
  const methods = data.byMethod || []

  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    '#4caf50',
    '#ff9800',
  ]

  return (
    <Box
      p={2}
      borderRadius={3}
      boxShadow={2}
      bgcolor="background.paper"
      display="flex"
      flexDirection="column"
      gap={1}
    >
      {/* Header */}
      <Box display="flex" alignItems="center" gap={1}>
        <PaymentIcon sx={{ color: theme.palette.primary.main }} />
        <Typography variant="subtitle2" color="text.secondary">
          Métodos de pago
        </Typography>
      </Box>

      {/* Total */}
      <Typography variant="h6" fontWeight="bold">
        {total} pagos
      </Typography>

      {/* Barra apilada */}
      <Box display="flex" height={10} borderRadius={5} overflow="hidden" mt={1}>
        {methods.map((m: any, index: number) => {
          const percent = Math.round((m.count * 100) / total)
          return (
            <Box
              key={m.metodo}
              flex={`${percent} 0 auto`}
              bgcolor={colors[index % colors.length]}
            />
          )
        })}
      </Box>

      {/* Leyenda */}
      <Box display="flex" flexWrap="wrap" gap={2} mt={1}>
        {methods.map((m: any, index: number) => {
          const percent = Math.round((m.count * 100) / total)
          return (
            <Box key={m.metodo} display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '3px',
                  bgcolor: colors[index % colors.length],
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {m.metodo}: {m.count} ({percent}%)
              </Typography>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
