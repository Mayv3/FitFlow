'use client'
import { BarChart, Bar, Tooltip, YAxis, ResponsiveContainer, XAxis } from 'recharts'
import { useTheme } from '@mui/material/styles'

type BarItem = { Plan: string; valor: number }
export const MiniSingleBarChart = ({ data }: { data: BarItem[] }) => {
  const theme = useTheme()
  return (
    <ResponsiveContainer width="100%" height={40}>
      <BarChart data={data}>
        <XAxis dataKey="Plan" hide />
        <YAxis hide domain={[0, 'dataMax + 10']} />
        <Tooltip
          wrapperStyle={{ zIndex: 9999 }}
          labelFormatter={(_, entry) => (entry && entry[0]?.payload?.Plan ? `Plan: ${entry[0].payload.Plan}` : '')}
          formatter={(value) => [`${value}`, 'Cantidad']}
        />
        <Bar dataKey="valor" fill={theme.palette.primary.main} barSize={6} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}