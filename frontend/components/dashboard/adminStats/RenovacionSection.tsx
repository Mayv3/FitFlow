'use client';

import { useState } from 'react';
import { Box, Card, CardContent, CircularProgress, MenuItem, TextField, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { useGymThemeSettings } from '@/hooks/useGymThemeSettings';
import { useRenovacion } from '@/hooks/dashboard/useRenovacion';
import { InfoTooltip } from '@/components/ui/tooltip/InfoTooltip';
import { YearSelector, useYearState } from './YearSelector';
import type { RenovacionMes } from '@/models/Stats/Renovacion';
import type { ChartTooltipProps } from '@/models/Charts/ChartTooltip';

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** % sobre los que ya se definieron; los pendientes no cuentan todavía. */
export function resumenMes(f: RenovacionMes) {
  const definidos = f.renovaron + f.abandonaron;
  const renovacion = definidos > 0 ? Math.round((f.renovaron / definidos) * 100) : null;
  return {
    renovacion,
    abandono: renovacion === null ? null : 100 - renovacion,
    parcial: f.pendientes > 0,
  };
}

/** El último mes cerrado con datos; si no hay, el último con algún dato. */
export function mesPorDefecto(filas: RenovacionMes[]) {
  const cerrados = filas.filter((f) => f.renovaron + f.abandonaron > 0 && f.pendientes === 0);
  if (cerrados.length) return cerrados[cerrados.length - 1].mes;
  const conDatos = filas.filter((f) => f.renovaron + f.abandonaron > 0);
  return conDatos.length ? conDatos[conDatos.length - 1].mes : 1;
}

type Punto = { mes: number; label: string; renovacion: number | null; parcial: boolean; fila: RenovacionMes };

export function RenovacionSection() {
  const t = useTheme();
  const { borderRadius, primaryColor } = useGymThemeSettings();
  const [year, setYear] = useYearState();
  const [mesElegido, setMesElegido] = useState<number | null>(null);
  const { data, isLoading, isError } = useRenovacion(year);

  const filas = data ?? [];
  const hayDatos = filas.some((f) => f.vencieron > 0);
  const mes = mesElegido ?? mesPorDefecto(filas);
  const fila = filas.find((f) => f.mes === mes);
  const actual = fila ? resumenMes(fila) : null;
  const filaAnterior = filas.find((f) => f.mes === mes - 1);
  const anterior = filaAnterior ? resumenMes(filaAnterior) : null;
  const delta = actual?.renovacion != null && anterior?.renovacion != null ? actual.renovacion - anterior.renovacion : null;

  const puntos: Punto[] = filas.map((f) => {
    const { renovacion, parcial } = resumenMes(f);
    return { mes: f.mes, label: capitalizar(MESES[f.mes - 1]).slice(0, 3), renovacion, parcial, fila: f };
  });

  const cardSx = {
    height: '100%',
    borderRadius,
    border: `1px solid ${alpha(t.palette.text.primary, 0.06)}`,
    bgcolor: t.palette.mode === 'dark' ? '#0a0a0a' : t.palette.background.paper,
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
  } as const;

  const renderTooltip = ({ active, payload }: ChartTooltipProps) => {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload as Punto;
    const r = resumenMes(p.fila);
    return (
      <Box
        sx={{
          borderRadius: '12px',
          border: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
          boxShadow: t.shadows[3],
          bgcolor: t.palette.mode === 'dark' ? '#1a1a1a' : t.palette.background.paper,
          px: 1.5, py: 1,
        }}
      >
        <Typography variant="caption" fontWeight={600} color="text.primary">
          {capitalizar(MESES[p.mes - 1])}{r.parcial ? ' (parcial)' : ''}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {r.renovacion === null ? 'Sin datos todavía' : `Renovó el ${r.renovacion}%`}
        </Typography>
        <Typography variant="caption" color="text.secondary" component="div">
          {p.fila.renovaron} renovaron · {p.fila.abandonaron} no
          {p.fila.pendientes > 0 ? ` · ${p.fila.pendientes} pendientes` : ''}
        </Typography>
      </Box>
    );
  };

  const renderDot = (props: { cx?: number; cy?: number; payload?: Punto }) => {
    const { cx, cy, payload } = props;
    if (cx == null || cy == null || !payload || payload.renovacion === null) return <g key={`dot-${payload?.mes}`} />;
    const elegido = payload.mes === mes;
    return (
      <circle
        key={`dot-${payload.mes}`}
        cx={cx}
        cy={cy}
        r={elegido ? 6 : 4}
        stroke={primaryColor}
        strokeWidth={2}
        fill={payload.parcial ? (t.palette.mode === 'dark' ? '#0a0a0a' : t.palette.background.paper) : primaryColor}
      />
    );
  };

  const renderResumen = () => {
    if (!fila || !actual) return null;
    return (
      <Box display="flex" flexDirection="column" gap={2} justifyContent="center">
        <Box>
          <Typography variant="caption" color="text.secondary">
            {capitalizar(MESES[mes - 1])} {year}
            {actual.parcial && (
              <Box component="span" sx={{ ml: 1, px: 0.75, py: 0.25, borderRadius: 1, bgcolor: alpha(t.palette.text.primary, 0.08) }}>
                parcial
              </Box>
            )}
          </Typography>
        </Box>

        <Box display="flex" gap={4}>
          <Box>
            <Typography variant="caption" color="text.secondary">Renovaron</Typography>
            <Typography data-testid="pct-renovacion" variant="h4" fontWeight={700} lineHeight={1.1}>
              {actual.renovacion === null ? '—' : `${actual.renovacion}%`}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Abandonaron</Typography>
            <Typography data-testid="pct-abandono" variant="h4" fontWeight={700} lineHeight={1.1} color="text.secondary">
              {actual.abandono === null ? '—' : `${actual.abandono}%`}
            </Typography>
          </Box>
        </Box>

        {delta !== null && (
          <Typography
            variant="body2"
            sx={{ color: delta > 0 ? 'success.main' : delta < 0 ? 'error.main' : 'text.secondary' }}
          >
            {delta > 0 ? '▲' : delta < 0 ? '▼' : '•'} {delta > 0 ? '+' : delta < 0 ? '−' : ''}{Math.abs(delta)} pts vs. {MESES[mes - 2]}
          </Typography>
        )}

        <Box>
          <Typography variant="body2" color="text.secondary">
            {fila.renovaron} renovaron · {fila.abandonaron} no renovaron
          </Typography>
          {fila.pendientes > 0 && (
            <Typography variant="body2" color="text.secondary">
              {fila.pendientes} todavía pueden renovar
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  const renderContenido = () => {
    if (isLoading) {
      return (
        <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={28} />
        </Box>
      );
    }
    if (isError) {
      return <Typography color="error" variant="body2">No se pudo cargar la renovación.</Typography>;
    }
    if (!hayDatos) {
      return (
        <Typography variant="body2" color="text.secondary">
          No hay vencimientos de planes en {year}.
        </Typography>
      );
    }
    return (
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', lg: '240px 1fr' }} gap={3}>
        {renderResumen()}
        <Box sx={{ width: '100%', height: 260, '& svg': { cursor: 'pointer' } }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={puntos}
              margin={{ top: 10, right: 16, left: -10, bottom: 0 }}
              onClick={(e) => {
                const idx = e?.activeTooltipIndex;
                if (idx == null) return;
                const p = puntos[Number(idx)];
                if (p) setMesElegido(p.mes);
              }}
            >
              <CartesianGrid vertical={false} stroke={alpha(t.palette.text.primary, 0.08)} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: t.palette.text.secondary, fontSize: 12 }}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(v: number) => `${v}%`}
                tickLine={false}
                axisLine={false}
                tick={{ fill: t.palette.text.secondary, fontSize: 12 }}
              />
              <Tooltip content={renderTooltip} cursor={{ stroke: alpha(t.palette.text.primary, 0.2) }} />
              <Line
                type="monotone"
                dataKey="renovacion"
                stroke={primaryColor}
                strokeWidth={2}
                dot={renderDot}
                activeDot={{ r: 6 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    );
  };

  return (
    <Card sx={cardSx}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} mb={2}>
          <Box display="flex" alignItems="center">
            <Typography variant="subtitle2" color="text.secondary">Renovación y abandono</Typography>
            <InfoTooltip
              title="De los alumnos cuyo plan vencía en cada mes, qué porcentaje volvió a pagar a más tardar 7 días después del vencimiento. Los que todavía están dentro de esos 7 días no cuentan hasta que se definan, por eso el mes en curso es parcial."
            />
          </Box>
          <Box display="flex" gap={1}>
            <TextField
              select
              size="small"
              label="Mes"
              value={hayDatos ? mes : ''}
              onChange={(e) => setMesElegido(Number(e.target.value))}
              disabled={!hayDatos}
              sx={{ minWidth: 140 }}
            >
              {MESES.map((m, i) => (
                <MenuItem key={m} value={i + 1}>{capitalizar(m)}</MenuItem>
              ))}
            </TextField>
            <YearSelector value={year} onChange={(y) => { setYear(y); setMesElegido(null); }} />
          </Box>
        </Box>
        {renderContenido()}
      </CardContent>
    </Card>
  );
}
