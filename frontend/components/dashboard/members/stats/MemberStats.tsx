'use client'

import { StatCard } from '@/components/ui/cards/StatCard'
import { Box } from '@mui/material'
import { ProgressChart } from '@/components/ui/charts/MiniProgressChart'
import PeopleIcon from '@mui/icons-material/People'
import { useTheme } from '@mui/material/styles'
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import { useGymStats } from '@/hooks/stats/useGymStats'
import { useGymStatsLive } from '@/hooks/stats/useGymStatsLive'
import EventSeatIcon from '@mui/icons-material/EventSeat';

export const MemberStats = ({ gymId }: { gymId?: string }) => {
  const theme = useTheme()
  const iconStyle = { color: theme.palette.primary.main, fontSize: 40 }
  const { data, isLoading } = useGymStats(gymId)

  const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n))

  const rawTotal = data?.totalMembers ?? 0
  const total = Math.max(0, rawTotal)

  const rawActive = data?.activeMembers ?? 0
  const active = clamp(rawActive, 0, total)

  const withPlanCount = data?.withPlanCount ?? 0

  const percentActive = data?.activePct ?? 0
  const percentWithPlan = data?.withPlanPct ?? 0

  const maxCapacity = 30
  const rawAttendance = data?.todaysAttendance ?? 0
  const todaysAttendance = clamp(rawAttendance, 0, maxCapacity)
  const attendancePercent = maxCapacity
    ? Math.round((todaysAttendance / maxCapacity) * 100)
    : 0

  useGymStatsLive(gymId)

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
        value={isLoading ? '—' : `${active} / ${total} (${percentActive}%)`}
        icon={<PeopleIcon sx={iconStyle} />}
        chart={<ProgressChart percentage={percentActive} />}
      />

      <StatCard
        title="Asistencias de hoy"
        value={
          isLoading ? '—' : `${todaysAttendance} / ${maxCapacity}`
        }
        icon={<EventSeatIcon sx={iconStyle} />}
        chart={<ProgressChart percentage={attendancePercent} />}
      />

      <StatCard
        title="Alumnos con plan"
        value={
          isLoading ? '—' : `${withPlanCount} / ${total} (${percentWithPlan}%)`
        }
        icon={<CardMembershipIcon sx={iconStyle} />}
        chart={<ProgressChart percentage={percentWithPlan} />}
      />
    </Box>
  )
}
