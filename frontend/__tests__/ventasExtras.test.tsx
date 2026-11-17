import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

jest.mock('@/hooks/dashboard/useVentasExtras', () => ({
  useVentasExtras: jest.fn(),
}));

import { useVentasExtras } from '@/hooks/dashboard/useVentasExtras';
import { VentasExtrasCard } from '@/components/dashboard/adminStats/VentasExtrasCard';

const mockedHook = useVentasExtras as jest.Mock;

const mes = (m: number, productos = 0, ventas_productos = 0, servicios = 0, ventas_servicios = 0) => ({
  mes: m, productos, servicios, ventas_productos, ventas_servicios,
});

const MESES = Array.from({ length: 12 }, (_, i) => mes(i + 1));
MESES[2] = mes(3, 60500, 18, 140000, 1);
MESES[3] = mes(4, 77700, 30);

const DATOS = {
  meses: MESES,
  top_productos: [
    { nombre: 'Agua Alcalina 600ml', ventas: 16, monto: 48000 },
    { nombre: 'Gatorade Uva 500ml', ventas: 13, monto: 45500 },
  ],
  top_servicios: [{ nombre: 'Readaptación Kinesio', ventas: 1, monto: 140000 }],
};

const columna = (nombre: RegExp) => screen.getByRole('region', { name: nombre });

describe('VentasExtrasCard', () => {
  beforeEach(() => {
    mockedHook.mockReset();
    mockedHook.mockReturnValue({ isLoading: false, isError: false, data: DATOS });
  });

  it('arranca con el año completo y muestra el total y las ventas de cada tipo', () => {
    render(<VentasExtrasCard />);

    expect(mockedHook.mock.calls[0][1]).toBe(0);

    const productos = columna(/productos/i);
    expect(within(productos).getByTestId('total')).toHaveTextContent('$138.20048 ventas');

    const servicios = columna(/servicios/i);
    expect(within(servicios).getByTestId('total')).toHaveTextContent('$140.0001 venta');
  });

  it('lista los más vendidos de cada tipo con su facturación', () => {
    render(<VentasExtrasCard />);

    const productos = columna(/productos/i);
    const items = within(productos).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Agua Alcalina 600ml');
    expect(items[0]).toHaveTextContent('$48.000');
    expect(items[0]).toHaveTextContent('16 ventas');
  });

  it('con un mes elegido muestra los totales de ese mes', async () => {
    const user = userEvent.setup();
    render(<VentasExtrasCard />);

    await user.click(screen.getByRole('combobox', { name: /mes/i }));
    await user.click(screen.getByRole('option', { name: /^abril$/i }));

    expect(mockedHook.mock.calls[mockedHook.mock.calls.length - 1][1]).toBe(4);
    expect(within(columna(/productos/i)).getByTestId('total')).toHaveTextContent('$77.70030 ventas');
    expect(within(columna(/servicios/i)).getByText(/sin ventas de servicios/i)).toBeInTheDocument();
  });

  it('avisa si el gym no tuvo ventas en todo el año', () => {
    mockedHook.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { meses: Array.from({ length: 12 }, (_, i) => mes(i + 1)), top_productos: [], top_servicios: [] },
    });

    render(<VentasExtrasCard />);

    expect(screen.getByText(/no se registraron ventas de productos ni servicios/i)).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /productos/i })).not.toBeInTheDocument();
  });
});
