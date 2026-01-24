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
        backgroundColor: '#f5f5f5',
      }}
    >
      <CircularProgress 
        size={50}
        thickness={4}
        sx={{
          color: '#0dc985',
          '& circle': {
            stroke: '#0dc985 !important',
          }
        }}
      />
      <Typography variant="body1" sx={{ color: '#666', fontWeight: 500 }}>
        {message}
      </Typography>
    </Box>
  );
};
