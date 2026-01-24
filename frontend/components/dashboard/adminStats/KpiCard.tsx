'use client';

import { Card, CardContent, Box, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

export interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  deltaPct?: number;
  loading?: boolean;
  iconSlot?: React.ReactNode;
  borderRadius?: number;
}

export function KpiCard({ title, value, subtitle, deltaPct, loading, iconSlot, borderRadius = 1.5 }: KpiCardProps) {
  const t = useTheme();
  const deltaColor = deltaPct == null
    ? 'text.secondary'
    : deltaPct > 0
      ? 'success.main'
      : deltaPct < 0
        ? 'error.main'
        : 'text.secondary';

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius,
        height: '100%',
        minHeight: 128,
        borderColor: alpha(t.palette.text.primary, 0.06),
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        bgcolor: t.palette.mode === 'dark' ? '#161616' : t.palette.background.paper,
      }}
    >
      <CardContent sx={{ p: 2.25 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.75}>
          <Typography variant="caption" color="text.secondary">{title}</Typography>
          {iconSlot}
        </Box>

        {loading ? (
          <Typography variant="body2" color="text.secondary">Cargando…</Typography>
        ) : (
          <>
            <Typography variant="h5" fontWeight={700} lineHeight={1.2}>{value}</Typography>

            <Box display="flex" gap={1} mt={0.5} alignItems="center">
              {subtitle && (
                <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
              )}
              {deltaPct != null && (
                <Typography variant="caption" sx={{ color: deltaColor }}>
                  {deltaPct > 0 ? '▲' : deltaPct < 0 ? '▼' : '•'} {Math.abs(deltaPct).toFixed(1)}%
                </Typography>
              )}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
