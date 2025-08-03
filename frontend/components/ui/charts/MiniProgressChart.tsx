'use client';

import { Box, LinearProgress, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

type ProgressChartProps = {
  percentage: number;
};

export const ProgressChart = ({ percentage }: ProgressChartProps) => {
  const theme = useTheme();

  return (
    <Box>
      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{
          height: 8,
          borderRadius: 5,
          backgroundColor: theme.palette.grey[300],
          '& .MuiLinearProgress-bar': {
            backgroundColor: theme.palette.primary.main,
          },
        }}
      />
      <Box mt={0.5} textAlign="right">
        <Typography variant="caption" color="textSecondary">
          {percentage}%
        </Typography>
      </Box>
    </Box>
  );
};
