'use client';

import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, MenuItem, TextField, Skeleton,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useKpis } from '@/hooks/dashboard/useKpis';
import { useFacturacionMes } from '@/hooks/dashboard/useFacturacionMes';
import { KpiCard } from './KpiCard';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { useGymThemeSettings } from '@/hooks/useGymThemeSettings';
import { buildYearOptions } from './YearSelector';

const MONTHS = [
  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' }, { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' }, { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
];

const fmtARS = (n: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n ?? 0);

export function KpisRow() {
  const t = useTheme();
  const { borderRadius } = useGymThemeSettings();

  // Otros KPIs: estado actual sin filtro
  const { data, isLoading } = useKpis();

  // KPI Facturación: mes+año propio
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [facYear, setFacYear] = useState(currentYear);
  const [facMonth, setFacMonth] = useState(currentMonth);
  const { data: facData, isLoading: facLoading } = useFacturacionMes(facYear, facMonth);

  const years = buildYearOptions();
  const kpis = data?.kpis;

  const deltaColor = (pct: number | undefined) =>
    pct == null ? 'text.secondary' : pct > 0 ? 'success.main' : pct < 0 ? 'error.main' : 'text.secondary';

  const cardSx = {
    borderRadius,
    height: '100%',
    minHeight: 128,
    borderColor: alpha(t.palette.text.primary, 0.06),
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
    bgcolor: t.palette.mode === 'dark' ? '#161616' : t.palette.background.paper,
  } as const;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

      {/* ── Facturación con filtro mes+año ── */}
      <div className="relative" style={{ borderRadius: `${borderRadius * 8}px` }}>
        <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={3} />
        <Card variant="outlined" sx={cardSx}>
          <CardContent sx={{ p: 2.25 }}>
            {/* Título + selectores */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.75} gap={0.5}>
              <Typography variant="caption" color="text.secondary" noWrap>Facturación</Typography>
              <Box display="flex" gap={0.5} flexShrink={0}>
                <TextField
                  select size="small"
                  value={facYear}
                  onChange={(e) => setFacYear(Number(e.target.value))}
                  sx={{ '& .MuiInputBase-root': { fontSize: 11 }, minWidth: 68 }}
                >
                  {years.map((y) => <MenuItem key={y} value={y} sx={{ fontSize: 12 }}>{y}</MenuItem>)}
                </TextField>
                <TextField
                  select size="small"
                  value={facMonth}
                  onChange={(e) => setFacMonth(Number(e.target.value))}
                  sx={{ '& .MuiInputBase-root': { fontSize: 11 }, minWidth: 90 }}
                >
                  {MONTHS.map((m) => <MenuItem key={m.value} value={m.value} sx={{ fontSize: 12 }}>{m.label}</MenuItem>)}
                </TextField>
              </Box>
            </Box>

            {/* Valor */}
            {facLoading ? (
              <Skeleton variant="text" width="70%" height={36} />
            ) : (
              <>
                <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
                  {fmtARS(facData?.actual ?? 0)}
                </Typography>
                <Box display="flex" gap={1} mt={0.5} alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    Mes anterior: {fmtARS(facData?.anterior ?? 0)}
                  </Typography>
                  {facData != null && (
                    <Typography variant="caption" sx={{ color: deltaColor(facData.deltaPct) }}>
                      {facData.deltaPct > 0 ? '▲' : facData.deltaPct < 0 ? '▼' : '•'}{' '}
                      {Math.abs(facData.deltaPct).toFixed(1)}%
                    </Typography>
                  )}
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Alumnos activos ── */}
      <div className="relative" style={{ borderRadius: `${borderRadius * 8}px` }}>
        <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={3} />
        <KpiCard
          title="Alumnos activos"
          loading={isLoading}
          value={`${kpis?.alumnos_totales > 0 ? Math.round((kpis.alumnos_activos / kpis.alumnos_totales) * 100) : 0}%`}
          subtitle={`(${kpis?.alumnos_activos ?? 0} de ${kpis?.alumnos_totales ?? 0} alumnos)`}
          borderRadius={borderRadius}
        />
      </div>

      {/* ── Asistencias promedio ── */}
      <div className="relative" style={{ borderRadius: `${borderRadius * 8}px` }}>
        <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={3} />
        <KpiCard
          title="Asistencias promedio"
          loading={isLoading}
          value={`${Math.round(kpis?.asistencias_promedio ?? 0)}`}
          subtitle="por día"
          borderRadius={borderRadius}
        />
      </div>

      {/* ── Plan más vendido ── */}
      <div className="relative" style={{ borderRadius: `${borderRadius * 8}px` }}>
        <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={3} />
        <KpiCard
          title="Plan más vendido"
          loading={isLoading}
          value={kpis?.plan_mas_vendido || 'N/A'}
          subtitle={`${kpis?.alumnos_plan_mas_vendido ?? 0} alumnos • ${Math.round(kpis?.porcentaje_plan_mas_vendido ?? 0)}%`}
          borderRadius={borderRadius}
        />
      </div>

    </div>
  );
}
