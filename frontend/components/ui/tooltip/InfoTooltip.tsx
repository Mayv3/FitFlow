'use client';

import { Tooltip, IconButton } from '@mui/material';
import InfoOutlined from '@mui/icons-material/InfoOutlined';

type InfoTooltipProps = {
  title: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
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
