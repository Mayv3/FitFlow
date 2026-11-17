import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

jest.mock('@/hooks/dashboard/useRenovacion', () => ({
  useRenovacion: jest.fn(),
}));

import { useRenovacion } from '@/hooks/dashboard/useRenovacion';
import { RenovacionSection, resumenMes, mesPorDefecto } from '@/components/dashboard/adminStats/RenovacionSection';

const mockedHook = useRenovacion as jest.Mock;

const fila = (mes: number, renovaron: number, abandonaron: number, pendientes = 0) => ({
  mes, vencieron: renovaron + abandonaron + pendientes, renovaron, abandonaron, pendientes,
});

// Sep y Oct cerrados, Nov en curso, Dic todo pendiente, el resto sin datos.
const FILAS = Array.from({ length: 12 }, (_, i) => fila(i + 1, 0, 0));
FILAS[8] = fila(9, 75, 25);
FILAS[9] = fila(10, 80, 20);
FILAS[10] = fila(11, 30, 10, 60);
FILAS[11] = fila(12, 0, 0, 300);

describe('resumenMes', () => {
  it('calcula el % sobre los que ya se definieron (renovaron + abandonaron)', () => {
    expect(resumenMes(fila(10, 80, 20))).toEqual({ renovacion: 80, abandono: 20, parcial: false });
  });

  it('marca como parcial el mes con pendientes', () => {
    expect(resumenMes(fila(11, 30, 10, 60))).toEqual({ renovacion: 75, abandono: 25, parcial: true });
  });

  it('devuelve null si nadie se definió todavía', () => {
    expect(resumenMes(fila(12, 0, 0, 300)).renovacion).toBeNull();
    expect(resumenMes(fila(1, 0, 0)).renovacion).toBeNull();
  });
});

describe('mesPorDefecto', () => {
  it('elige el último mes cerrado con datos', () => {
    expect(mesPorDefecto(FILAS)).toBe(10);
  });

  it('si no hay meses cerrados, el último con datos', () => {
    expect(mesPorDefecto([fila(1, 0, 0), fila(2, 3, 1, 5)])).toBe(2);
  });
});

describe('RenovacionSection', () => {
  beforeEach(() => {
    mockedHook.mockReturnValue({ isLoading: false, isError: false, data: FILAS });
  });

  it('muestra el resumen del último mes cerrado con la variación contra el mes anterior', () => {
    render(<RenovacionSection />);

    expect(screen.getByTestId('pct-renovacion')).toHaveTextContent('80%');
    expect(screen.getByTestId('pct-abandono')).toHaveTextContent('20%');
    expect(screen.getByText(/\+5 pts vs\. septiembre/i)).toBeInTheDocument();
    expect(screen.getByText(/80 renovaron · 20 no renovaron/i)).toBeInTheDocument();
    expect(screen.queryByText(/parcial/i)).not.toBeInTheDocument();
  });

  it('al elegir un mes en curso lo marca como parcial y muestra los pendientes', async () => {
    const user = userEvent.setup();
    render(<RenovacionSection />);

    await user.click(screen.getByRole('combobox', { name: /mes/i }));
    await user.click(screen.getByRole('option', { name: /noviembre/i }));

    expect(screen.getByTestId('pct-renovacion')).toHaveTextContent('75%');
    expect(screen.getByText(/parcial/i)).toBeInTheDocument();
    expect(screen.getByText(/60 todavía pueden renovar/i)).toBeInTheDocument();
  });

  it('muestra un mensaje si el año no tiene vencimientos', () => {
    mockedHook.mockReturnValue({ isLoading: false, isError: false, data: FILAS.map((f) => fila(f.mes, 0, 0)) });

    render(<RenovacionSection />);

    expect(screen.getByText(/no hay vencimientos/i)).toBeInTheDocument();
  });
});
