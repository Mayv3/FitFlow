'use client';

import {
  Box,
} from '@mui/material';

import { AsistenciasHoyPorHoraCard } from './AsistenciasPorHoraCard';
import { AsistenciasHoyListaCard } from './AsistenciasHoyListaCard';

export function AsistenciasSection() {
  return (
    <Box>
      <Box
        display="grid"
        gridTemplateColumns={{ xs: '1fr', md: '1fr 2fr' }}
        alignItems="stretch"
        gap={2}
        mt="14px"
      >

        <AsistenciasHoyListaCard />
        <AsistenciasHoyPorHoraCard />

        {/*

        */}
      </Box>
    </Box>
  );
}
