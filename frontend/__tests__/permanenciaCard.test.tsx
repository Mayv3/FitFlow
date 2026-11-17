import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@/hooks/dashboard/usePermanencia', () => ({
  usePermanencia: jest.fn(),
}));

import { usePermanencia } from '@/hooks/dashboard/usePermanencia';
import { PermanenciaCard } from '@/components/dashboard/adminStats/PermanenciaCard';
import type { PermanenciaResponse, PermanenciaTramo } from '@/models/Stats/Permanencia';

const mockedHook = usePermanencia as jest.Mock;

const tramos = (pares: [number, number][]): PermanenciaTramo[] =>
  (['0-1', '1-3', '3-6', '6-12', '12+'] as const).map((tramo, i) => ({
    tramo,
    activos: pares[i][0],
    se_fueron: pares[i][1],
  }));

const DATOS: PermanenciaResponse = {
  total: 822,
  activos: 464,
  meses_promedio: 2.5,
  valor_promedio: 74720,
  tramos: tramos([[45, 61], [82, 195], [110, 66], [227, 36], [0, 0]]),
};

const conDatos = (data: PermanenciaResponse) =>
  mockedHook.mockReturnValue({ isLoading: false, isError: false, data });

describe('PermanenciaCard', () => {
  it('muestra la permanencia promedio y el valor promedio de los que se fueron', () => {
    conDatos(DATOS);
    render(<PermanenciaCard />);

    expect(screen.getByTestId('meses-promedio')).toHaveTextContent('2,5 meses');
    expect(screen.getByTestId('valor-promedio')).toHaveTextContent(/\$\s?74\.720/);
  });

  it('muestra cada tramo con sus activos y los que se fueron', () => {
    conDatos(DATOS);
    render(<PermanenciaCard />);

    expect(screen.getByRole('img', { name: '1 a 3 meses: 82 activos, 195 se fueron' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Más de 12 meses: 0 activos, 0 se fueron' })).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(5);
  });

  it('si todavía no se fue nadie, lo dice en lugar de mostrar promedios', () => {
    conDatos({
      total: 185, activos: 185, meses_promedio: null, valor_promedio: null,
      tramos: tramos([[185, 0], [0, 0], [0, 0], [0, 0], [0, 0]]),
    });
    render(<PermanenciaCard />);

    expect(screen.getByTestId('meses-promedio')).toHaveTextContent('—');
    expect(screen.getByTestId('valor-promedio')).toHaveTextContent('—');
    expect(screen.getByText(/todavía no se fue ningún alumno/i)).toBeInTheDocument();
  });

  it('sin pagos de planes muestra un mensaje vacío', () => {
    conDatos({
      total: 0, activos: 0, meses_promedio: null, valor_promedio: null,
      tramos: tramos([[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]),
    });
    render(<PermanenciaCard />);

    expect(screen.getByText(/todavía no hay pagos de planes/i)).toBeInTheDocument();
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });

  it('muestra el error si falla la carga', () => {
    mockedHook.mockReturnValue({ isLoading: false, isError: true, data: undefined });
    render(<PermanenciaCard />);

    expect(screen.getByText(/no se pudo cargar la permanencia/i)).toBeInTheDocument();
  });
});
