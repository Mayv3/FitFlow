'use client';

import { Tooltip, IconButton, Box, Typography } from '@mui/material';
import InfoOutlined from '@mui/icons-material/InfoOutlined';

type InfoTooltipProps = {
  title: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
};

type RoundedTooltipProps = {
  active?: boolean;
  payload?: any[];
  label?: string | number;
  formatter?: (entry: any) => React.ReactNode;
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

  const d = payload[0].payload;

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
          color={entry.value >= 0 ? 'text.primary' : 'error.main'}
        >
          {formatter ? formatter(entry) : `${entry.name}: ${entry.value}`}
        </Typography>
      ))}
    </Box>
  );
};


export const FacturacionTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;

  const d = payload[0].payload;

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
        color={d.variacion >= 0 ? "success.main" : "error.main"}
      >
        Variación:{" "}
        {d.variacion
          ? (d.variacion >= 0 ? "+" : "") + d.variacion.toLocaleString("es-AR")
          : "Sin datos"}
      </Typography>
    </Box>
  );
};