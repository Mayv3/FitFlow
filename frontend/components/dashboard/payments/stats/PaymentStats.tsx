'use client'

import { StatCard } from '@/components/ui/cards/StatCard'
import { Box, Typography, Tooltip } from '@mui/material'
import { useTheme, alpha, lighten, darken } from '@mui/material/styles'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import PaymentIcon from '@mui/icons-material/Payment'
import CategoryIcon from '@mui/icons-material/Category'

export const PaymentStats = ({ data, isLoading }: { data?: any; isLoading: boolean }) => {
  const theme = useTheme()
  const iconStyle = { color: theme.palette.primary.main, fontSize: 40 }

  const totalMonto = data?.montoFiltrado ?? 0
  const totalPagos = data?.pagosFiltrados ?? 0
  const byMethod = data?.byMethod ?? []
  const byTipo = data?.byTipo ?? []

  const getColor = (index: number) => {
    const variations = [
      theme.palette.primary.main,
      darken(theme.palette.primary.main, 0.3),
      lighten(theme.palette.primary.main, 0.3),
      darken(theme.palette.primary.main, 0.15),
      lighten(theme.palette.primary.main, 0.15),
      alpha(theme.palette.primary.main, 0.6),
    ]
    return variations[index % variations.length]
  }

  return (
    <Box
      mt={2}
      width="100%"
      display="grid"
      gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }}
      sx={{ gap: 2 }}
    >
      <StatCard
        title="Total recaudado"
        value={isLoading ? '—' : `$ ${totalMonto.toLocaleString('es-AR')}`}
        icon={<AttachMoneyIcon sx={iconStyle} />}
        chart={
          <Box display="flex" flexDirection="column" width="100%" mt={1}>
            <Box height={8} bgcolor={theme.palette.primary.main} borderRadius={4} />
            <Typography variant="caption" color="text.secondary" mt={1} textAlign="left">
              {totalPagos} pagos
            </Typography>
          </Box>
        }
      />

      {/* Pagos por tipo */}
      <StatCard
        title="Pagos por tipo"
        value={isLoading ? '—' : `${totalPagos} pagos`}
        icon={<CategoryIcon sx={iconStyle} />}
        chart={
          <Box display="flex" flexDirection="column" width="100%" mt={1}>
            <Box display="flex" height={10} borderRadius={5} overflow="hidden">
              {byTipo.map((t: any, index: number) => {
                const percent = Math.round((t.count * 100) / (totalPagos || 1))
                return (
                  <Tooltip
                    key={t.tipo}
                    title={`${t.tipo}: $ ${t.monto.toLocaleString('es-AR')} (${t.count} pagos)`}
                    arrow
                  >
                    <Box flex={`${percent} 0 auto`} bgcolor={getColor(index)} sx={{ cursor: 'pointer' }} />
                  </Tooltip>
                )
              })}
            </Box>

            <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
              {byTipo.map((t: any, index: number) => {
                const percent = Math.round((t.count * 100) / (totalPagos || 1))
                return (
                  <Box key={t.tipo} display="flex" alignItems="center" gap={0.5}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: getColor(index) }} />
                    <Typography variant="caption" color="text.secondary">
                      {t.tipo}: {percent}% ({t.count})
                    </Typography>
                  </Box>
                )
              })}
            </Box>
          </Box>
        }
      />

      {/* Pagos por método */}
      <StatCard
        title="Pagos por método"
        value={isLoading ? '—' : `${totalPagos} pagos`}
        icon={<PaymentIcon sx={iconStyle} />}
        chart={
          <Box display="flex" flexDirection="column" width="100%" mt={1}>
            <Box display="flex" height={10} borderRadius={5} overflow="hidden">
              {byMethod.map((m: any, index: number) => {
                const percent = Math.round((m.count * 100) / (totalPagos || 1))
                return (
                  <Tooltip
                    key={m.metodo}
                    title={`$ ${m.monto.toLocaleString('es-AR')} (${m.count} pagos)`}
                    arrow
                  >
                    <Box flex={`${percent} 0 auto`} bgcolor={getColor(index)} sx={{ cursor: 'pointer' }} />
                  </Tooltip>
                )
              })}
            </Box>

            <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
              {byMethod.map((m: any, index: number) => {
                const percent = Math.round((m.count * 100) / (totalPagos || 1))
                return (
                  <Box key={m.metodo} display="flex" alignItems="center" gap={0.5}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: getColor(index) }} />
                    <Typography variant="caption" color="text.secondary">
                      {m.metodo}: {percent}% ({m.count})
                    </Typography>
                  </Box>
                )
              })}
            </Box>
          </Box>
        }
      />
    </Box>
  )
}
