import * as React from 'react';
import { Chip, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded';
import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded';
import RemoveCircleOutlineRounded from '@mui/icons-material/RemoveCircleOutlineRounded';

type EstadoCode = 'active' | 'expiring' | 'expired' | 'none' | 'limit';

export function StateCheap({
  code,
  label,
  daysDiff,
}: {
  code: EstadoCode;
  label: string;
  daysDiff: number | null;
}) {
  const icon =
    code === 'active' ? <CheckCircleRounded /> :
      code === 'expiring' ? <AccessTimeRounded /> :
        code === 'expired' ? <ErrorOutlineRounded /> :
          code === 'limit' ? undefined :
            <RemoveCircleOutlineRounded />;

  const sx = (theme: any) => {
    const soft = (color: string) => ({
      bgcolor: alpha(color, 0.12),
      color: alpha(color, 0.9),
      border: `1px solid ${alpha(color, 0.18)}`,
    });

    const map = {
      active: soft(theme.palette.success.main),
      expiring: soft(theme.palette.warning.main),
      expired: soft(theme.palette.error.main),
      limit: soft(theme.palette.error.dark),
      none: {
        bgcolor: alpha(theme.palette.text.primary, 0.06),
        color: alpha(theme.palette.text.primary, 0.7),
        border: `1px solid ${alpha(theme.palette.text.primary, 0.12)}`
      },
    } as const;

    return {
      ...map[code],
      borderRadius: 999,
      fontWeight: 600,
      px: 1,
      '& .MuiChip-icon': { fontSize: 18, opacity: 0.9 },
    };
  };

  const hint =
    code === 'active' && daysDiff != null ? `Vence en ${daysDiff} día(s)` :
      code === 'expiring' && daysDiff != null ? `Vence en ${daysDiff} día(s)` :
        code === 'expired' && daysDiff != null ? `Venció hace ${Math.abs(daysDiff)} día(s)` :
          label;

  return (
    <Tooltip title={hint}>
      <Chip size="small" icon={icon} label={label} sx={sx} />
    </Tooltip>
  );
}
