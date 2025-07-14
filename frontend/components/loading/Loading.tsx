'use client';

import { Box, CircularProgress, Typography } from '@mui/material';

export const Loading = ({ message = 'Cargando...' }: { message?: string }) => {
  return (
    <Box
      sx={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <CircularProgress color="primary" />
      <Typography variant="body1" color="textSecondary">
        {message}
      </Typography>
    </Box>
  );
};
