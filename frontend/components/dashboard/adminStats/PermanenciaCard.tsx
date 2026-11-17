'use client';

import { Box, Card, CardContent, CircularProgress, Tooltip, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useGymThemeSettings } from '@/hooks/useGymThemeSettings';
import { usePermanencia } from '@/hooks/dashboard/usePermanencia';
import { InfoTooltip } from '@/components/ui/tooltip/InfoTooltip';
import type { TramoPermanencia } from '@/models/Stats/Permanencia';

const ETIQUETAS: Record<TramoPermanencia, string> = {
  '0-1': 'Menos de 1 mes',
  '1-3': '1 a 3 meses',
  '3-6': '3 a 6 meses',
  '6-12': '6 a 12 meses',
  '12+': 'Más de 12 meses',
};

const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const meses = (n: number) => `${n.toLocaleString('es-AR', { maximumFractionDigits: 1 })} ${n === 1 ? 'mes' : 'meses'}`;

function Dato({ testId, valor, etiqueta }: { testId: string; valor: string; etiqueta: string }) {
  return (
    <Box minWidth={0}>
      <Typography data-testid={testId} variant="h6" fontWeight={600} lineHeight={1.2} noWrap>
        {valor}
      </Typography>
      <Typography variant="caption" color="text.secondary">{etiqueta}</Typography>
    </Box>
  );
}

export function PermanenciaCard() {
  const t = useTheme();
  const { borderRadius, primaryColor } = useGymThemeSettings();
  const { data, isLoading, isError } = usePermanencia();

  const surface = t.palette.mode === 'dark' ? '#0a0a0a' : t.palette.background.paper;
  const colorSeFueron = alpha(t.palette.text.primary, 0.22);

  const renderContenido = () => {
    if (isLoading) {
      return (
        <Box sx={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={28} />
        </Box>
      );
    }
    if (isError || !data) {
      return <Typography color="error" variant="body2">No se pudo cargar la permanencia.</Typography>;
    }
    if (data.total === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          Todavía no hay pagos de planes registrados.
        </Typography>
      );
    }

    const max = Math.max(...data.tramos.map((x) => x.activos + x.se_fueron), 1);

    return (
      <>
        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1.5} mb={1}>
          <Dato
            testId="meses-promedio"
            valor={data.meses_promedio === null ? '—' : meses(data.meses_promedio)}
            etiqueta="Permanencia promedio"
          />
          <Dato
            testId="valor-promedio"
            valor={data.valor_promedio === null ? '—' : pesos.format(data.valor_promedio)}
            etiqueta="Valor promedio por alumno"
          />
        </Box>
        <Typography variant="caption" color="text.secondary" component="p" mb={2}>
          {data.meses_promedio === null
            ? 'Todavía no se fue ningún alumno.'
            : 'De los alumnos que ya se fueron.'}
        </Typography>

        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1.25 }}>
          {data.tramos.map((x) => {
            const etiqueta = ETIQUETAS[x.tramo];
            const total = x.activos + x.se_fueron;
            const texto = `${etiqueta}: ${x.activos} activos, ${x.se_fueron} se fueron`;
            return (
              <Box component="li" key={x.tramo}>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2" color="text.secondary">{etiqueta}</Typography>
                  <Typography variant="body2" fontWeight={600}>{total}</Typography>
                </Box>
                <Tooltip title={texto} arrow disableInteractive>
                  <Box
                    role="img"
                    aria-label={texto}
                    sx={{
                      display: 'flex',
                      height: 12,
                      borderRadius: 6,
                      overflow: 'hidden',
                      bgcolor: alpha(t.palette.text.primary, 0.04),
                    }}
                  >
                    <Box sx={{ width: `${(x.activos / max) * 100}%`, bgcolor: primaryColor }} />
                    <Box sx={{ width: `${(x.se_fueron / max) * 100}%`, bgcolor: colorSeFueron }} />
                  </Box>
                </Tooltip>
              </Box>
            );
          })}
        </Box>

        <Box display="flex" gap={2} mt={2}>
          {[
            { label: 'Activos', color: primaryColor },
            { label: 'Se fueron', color: colorSeFueron },
          ].map((l) => (
            <Box key={l.label} display="flex" alignItems="center" gap={0.75}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: l.color }} />
              <Typography variant="caption" color="text.secondary">{l.label}</Typography>
            </Box>
          ))}
        </Box>
      </>
    );
  };

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius,
        border: `1px solid ${alpha(t.palette.text.primary, 0.06)}`,
        bgcolor: surface,
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Typography variant="subtitle2" color="text.secondary">Permanencia de alumnos</Typography>
          <InfoTooltip title="Cuántos meses se quedan los alumnos, desde su primer pago de plan hasta el último vencimiento pagado (o hasta hoy si siguen activos). Se cuenta desde que el gym usa FitFlow. Un alumno 'se fue' si su plan venció hace más de 7 días sin renovar." />
        </Box>
        {renderContenido()}
      </CardContent>
    </Card>
  );
}
