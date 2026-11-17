import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cada sección se reemplaza por un marcador: acá solo importa el orden y la grilla.
// Declaración `function` (no const): los jest.mock y el import se elevan arriba de todo.
function mockStub(nombre: string) {
  return function Marcador() {
    return <div data-testid={nombre} />;
  };
}
jest.mock('@/components/dashboard/adminStats/KpiRow', () => ({ KpisRow: mockStub('kpis') }));
jest.mock('@/components/dashboard/adminStats/FacturacionSection', () => ({ FacturacionSection: mockStub('facturacion') }));
jest.mock('@/components/dashboard/adminStats/DemografiaSection', () => ({ DemografiaSection: mockStub('demografia') }));
jest.mock('@/components/dashboard/adminStats/AlumnosPorOrigenSection', () => ({ AlumnosPorOrigenSection: mockStub('origen') }));
jest.mock('@/components/dashboard/adminStats/PlanesSection', () => ({ PlanesSection: mockStub('planes') }));
jest.mock('@/components/dashboard/adminStats/VentasExtrasCard', () => ({ VentasExtrasCard: mockStub('ventas') }));
jest.mock('@/components/dashboard/adminStats/AsistenciasSection', () => ({ AsistenciasSection: mockStub('asistencias') }));
jest.mock('@/components/dashboard/adminStats/AlumnosEnRiesgoCard', () => ({ AlumnosEnRiesgoCard: mockStub('riesgo') }));
jest.mock('@/components/dashboard/adminStats/RenovacionSection', () => ({ RenovacionSection: mockStub('renovacion') }));
jest.mock('@/components/dashboard/adminStats/AsistenciasHeatmapCard', () => ({ AsistenciasHeatmapCard: mockStub('heatmap') }));
jest.mock('@/components/dashboard/adminStats/PermanenciaCard', () => ({ PermanenciaCard: mockStub('permanencia') }));
jest.mock('@/components/ui/breadcrums/CustomBreadcrumbs', () => ({ CustomBreadcrumbs: () => null }));

import Overview from '@/components/dashboard/adminStats/Overview';

describe('Overview de estadísticas', () => {
  it('pone los gráficos nuevos al final: riesgo y renovación en una fila, y el mapa de calor con permanencia debajo', () => {
    render(<Overview />);

    const orden = screen.getAllByTestId(/.+/).map((el) => el.dataset.testid);
    expect(orden).toEqual([
      'kpis', 'facturacion', 'demografia', 'origen', 'planes', 'ventas', 'asistencias',
      'riesgo', 'renovacion', 'heatmap', 'permanencia',
    ]);

    // Riesgo y renovación comparten la misma fila (mismo contenedor); el mapa de calor no.
    const fila = screen.getByTestId('riesgo').parentElement;
    expect(fila).toContainElement(screen.getByTestId('renovacion'));
    expect(fila).not.toContainElement(screen.getByTestId('heatmap'));

    // El mapa de calor y la permanencia comparten otra fila.
    const filaHeatmap = screen.getByTestId('heatmap').parentElement;
    expect(filaHeatmap).toContainElement(screen.getByTestId('permanencia'));
    expect(filaHeatmap).not.toContainElement(screen.getByTestId('riesgo'));
  });
});
