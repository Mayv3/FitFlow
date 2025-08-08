import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { useTheme } from '@mui/material/styles'

type Point = { label: string; value: number }
export const MiniLineChart = ({ data }: { data: Point[] }) => {
  const theme = useTheme()
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data}>
        <XAxis dataKey="label" hide />
        <Line type="monotone" dataKey="value" stroke={theme.palette.primary.main} strokeWidth={2} dot={false} />
        <Tooltip
          contentStyle={{ backgroundColor: theme.palette.background.paper, border: 'none', fontSize: 12 }}
          labelFormatter={(label) => `Día: ${label}`}
          formatter={(value) => [`${value} Asistencias`]}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}