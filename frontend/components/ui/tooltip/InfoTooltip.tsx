'use client';

import { Tooltip, IconButton, Box, Typography } from '@mui/material';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import type { ChartTooltipEntry, ChartTooltipProps } from '@/models/Charts/ChartTooltip';

type InfoTooltipProps = {
  title: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
};

// `formatter` va aparte del de recharts: acá recibe la entrada entera, no
// (value, name, item, …), así que se reemplaza en vez de intersectarse.
type RoundedTooltipProps = Omit<ChartTooltipProps, 'formatter'> & {
  formatter?: (entry: ChartTooltipEntry) => React.ReactNode;
};

/** Datum que arma FacturacionSection para cada barra del grafico. */
type FacturacionDatum = {
  plan_nombre?: string;
  actual?: number;
  anterior?: number;
  variacion?: number;
};

export function InfoTooltip({ title, placement = 'top' }: InfoTooltipProps) {
  return (
    <Tooltip title={title} arrow placement={placement}>
      <IconButton size="small">
        <InfoOutlined fontSize="small" color="action" />
      </IconButton>
    </Tooltip>
  );
}

export const RoundedTooltip = ({ active, payload, label, formatter }: RoundedTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 1,
        bgcolor: 'background.paper',
        boxShadow: 2,
        fontSize: 12,
        maxWidth: 220,
      }}
    >
      {label && (
        <Typography variant="body2" fontWeight={600} gutterBottom>
          {label}
        </Typography>
      )}

      {payload.map((entry, i) => (
        <Typography
          key={i}
          variant="body2"
          color={Number(entry.value) >= 0 ? 'text.primary' : 'error.main'}
        >
          {formatter ? formatter(entry) : `${entry.name}: ${entry.value}`}
        </Typography>
      ))}
    </Box>
  );
};


export const FacturacionTooltip = ({ active, payload }: ChartTooltipProps) => {
  if (!active || !payload || !payload.length) return null;

  const d = payload[0].payload as FacturacionDatum;

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 1.5,
        bgcolor: "background.paper",
        boxShadow: 2,
        fontSize: 12,
        maxWidth: 220,
      }}
    >
      <Typography variant="body2" fontWeight={600}>
        {d.plan_nombre}
      </Typography>
      <Typography variant="body2">
        Mes actual: {d.actual ? `$${d.actual.toLocaleString("es-AR")}` : "Sin datos"}
      </Typography>
      <Typography variant="body2">
        Mes anterior: {d.anterior ? `$${d.anterior.toLocaleString("es-AR")}` : "Sin datos"}
      </Typography>
      <Typography
        variant="body2"
        color={(d.variacion ?? 0) >= 0 ? "success.main" : "error.main"}
      >
        Variación:{" "}
        {d.variacion
          ? (d.variacion >= 0 ? "+" : "") + d.variacion.toLocaleString("es-AR")
          : "Sin datos"}
      </Typography>
    </Box>
  );
};