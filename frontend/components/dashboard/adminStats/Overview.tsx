'use client';

import { Box, Container } from '@mui/material';
import { KpisRow } from './KpiRow';
import { FacturacionSection } from './FacturacionSection';
import { CustomBreadcrumbs } from '@/components/ui/breadcrums/CustomBreadcrumbs';
import { DemografiaSection } from './DemografiaSection';
import { PlanesSection } from './PlanesSection';
import { AsistenciasSection } from './AsistenciasSection';
import { AlumnosPorOrigenSection } from './AlumnosPorOrigenSection';
import { AlumnosEnRiesgoCard } from './AlumnosEnRiesgoCard';
import { RenovacionSection } from './RenovacionSection';
import { AsistenciasHeatmapCard } from './AsistenciasHeatmapCard';
import { VentasExtrasCard } from './VentasExtrasCard';
import { PermanenciaCard } from './PermanenciaCard';

export default function Overview() {
  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <CustomBreadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard/receptionist' },
          { label: 'Estadísticas' },
        ]}
      />
      <KpisRow />
      <FacturacionSection />
      <DemografiaSection />
      <AlumnosPorOrigenSection />
      <PlanesSection />
      <VentasExtrasCard />
      <AsistenciasSection />
      <Box
        mt={2}
        display="grid"
        gridTemplateColumns={{ xs: '1fr', md: '1fr 2fr' }}
        gap={1.5}
        alignItems="stretch"
      >
        <AlumnosEnRiesgoCard />
        <RenovacionSection />
      </Box>
      <Box
        mt={2}
        display="grid"
        gridTemplateColumns={{ xs: '1fr', md: '2fr 1fr' }}
        gap={1.5}
        alignItems="stretch"
        sx={{ '& > *': { minWidth: 0 } }}
      >
        <AsistenciasHeatmapCard />
        <PermanenciaCard />
      </Box>
    </Container>
  );
}
