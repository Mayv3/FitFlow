'use client';

import { Box, Container } from '@mui/material';
import { KpisRow } from './KpiRow';
import { FacturacionSection } from './FacturacionSection';
import { AlumnosSection } from './AlumnosSection';

import { CustomBreadcrumbs } from '@/components/ui/breadcrums/CustomBreadcrumbs';

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
      {/* <AsistenciasSection/> */}
      {/* <PlanesSection/> */}
    </Container>
  );
}
