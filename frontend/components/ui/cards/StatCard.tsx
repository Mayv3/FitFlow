'use client';

import { Box, Paper, Typography } from '@mui/material';
import { FC, ReactNode } from 'react';

type StatCardProps = {
  title: string;
  value: string | number;
  icon?: ReactNode;
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'warning' | 'success' | 'inherit';
  size?: 'small' | 'medium' | 'large';
  chart?: ReactNode;
};

export const StatCard: FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = 'primary',
  size = 'medium',
  chart,
}) => {
  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
      }}
    >
      <Box display="flex" alignItems="center" gap={2}>
        {icon && <Box color={color}>{icon}</Box>}
        <Box>
          <Typography
            variant={size === 'small' ? 'body2' : 'body1'}
            color="text.secondary"
            fontWeight={500}
          >
            {title}
          </Typography>
          <Typography
            variant={size === 'small' ? 'h6' : size === 'large' ? 'h4' : 'h5'}
            fontWeight={600}
          >
            {value}
          </Typography>
        </Box>
      </Box>

      {chart && (
        <Box mt={2}>
          {chart}
        </Box>
      )}
    </Paper>
  );
};
