'use client'

import { MiniLineChart } from '@/components/ui/charts/MiniLineChart'
import { StatCard } from '@/components/ui/cards/StatCard'
import { Box } from '@mui/material'
import { ProgressChart } from '@/components/ui/charts/MiniProgressChart'
import BarChartIcon from '@mui/icons-material/BarChart'
import PeopleIcon from '@mui/icons-material/People'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import { useTheme } from '@mui/material/styles'
import { MiniSingleBarChart } from '@/components/ui/charts/MinisingleBarChart'
import { useGymStats } from '@/hooks/stats/useGymStats'

export const MemberStats = ({ gymId }: { gymId?: string }) => {
  const theme = useTheme()
  const iconStyle = { color: theme.palette.primary.main, fontSize: 40 }
  const { data, isLoading } = useGymStats(gymId)

  const total = data?.totalMembers ?? 0
  const active = data?.activeMembers ?? 0
  const percentActive = total ? Math.round((active * 100) / total) : 0

  const asistenciaData = [{ label: 'Hoy', value: data?.todaysAttendance ?? 0 }]

  const planesData = data?.plansDistribution ?? []

  return (
    <Box
      mt={2}
      width="100%"
      display="grid"
      gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }}
      sx={{ height: 'auto', gap: 2 }}
    >
      <StatCard
        title="Miembros activos"
        value={isLoading ? '—' : `${active} / ${total}`}
        icon={<PeopleIcon sx={iconStyle} />}
        chart={<ProgressChart percentage={percentActive} />}
      />

      <StatCard
        title="Asistencias de hoy"
        value={isLoading ? '—' : `Total: ${data?.todaysAttendance ?? 0}`}
        icon={<BarChartIcon sx={iconStyle} />}
        chart={<MiniLineChart data={asistenciaData} />}
      />

      <StatCard
        title="Alumnos con plan"
        value={isLoading ? '—' : `${data?.withPlanPct ?? 0}%`}
        icon={<AccessTimeIcon sx={iconStyle} />}
        chart={<MiniSingleBarChart data={planesData} />}
      />
    </Box>
  )
}
