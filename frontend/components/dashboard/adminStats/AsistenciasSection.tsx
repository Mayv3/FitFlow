'use client';

import { Box } from '@mui/material';
import moment from 'moment';
import { useState } from 'react';

import { AsistenciasHoyPorHoraCard } from './AsistenciasPorHoraCard';
import { AsistenciasHoyListaCard } from './AsistenciasHoyListaCard';

export function AsistenciasSection() {
  const [fecha, setFecha] = useState<string | null>(
    moment().format('YYYY-MM-DD')
  );

  return (
    <Box
      mt={2}
      display="grid"
      gridTemplateColumns={{ xs: '1fr', md: '1fr 2fr' }}
      gap={1.5}
      alignItems="stretch"
    >
      {/* Lista de asistencias */}
      <AsistenciasHoyListaCard
        fecha={fecha}
        onFechaChange={setFecha}
      />

      {/* Gráfico por hora */}
      <AsistenciasHoyPorHoraCard
        fecha={fecha}
      />
    </Box>
  );
}
