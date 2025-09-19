'use client';

import { Container } from '@mui/material';
import { KpisRow } from './KpiRow';
import { FacturacionSection } from './FacturacionSection';

import { CustomBreadcrumbs } from '@/components/ui/breadcrums/CustomBreadcrumbs';
import { DemografiaSection } from './DemografiaSection';
import { PlanesSection } from './PlanesSection';

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
      <PlanesSection/>

    </Container>

  );
}
