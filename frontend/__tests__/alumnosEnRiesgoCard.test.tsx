import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

jest.mock('@/hooks/dashboard/useAlumnosEnRiesgo', () => ({
  useAlumnosEnRiesgo: jest.fn(),
}));

import { useAlumnosEnRiesgo } from '@/hooks/dashboard/useAlumnosEnRiesgo';
import { AlumnosEnRiesgoCard } from '@/components/dashboard/adminStats/AlumnosEnRiesgoCard';

const mockedHook = useAlumnosEnRiesgo as jest.Mock;

const alumno = (over: Record<string, unknown>) => ({
  id: 1,
  nombre: 'Ana López',
  dni: '30111222',
  telefono: '3511234567',
  plan_nombre: 'Musculación',
  ultima_asistencia: '2026-10-20',
  dias_sin_venir: 20,
  fecha_de_vencimiento: '2026-11-30',
  ...over,
});

const ITEMS = [
  alumno({}),
  alumno({ id: 2, nombre: 'Beto Díaz', dias_sin_venir: 29 }),
  alumno({ id: 3, nombre: 'Carla Paz', dias_sin_venir: 45 }),
  alumno({ id: 4, nombre: 'Dani Ruiz', dias_sin_venir: 90 }),
  alumno({ id: 5, nombre: 'Eli Sosa', ultima_asistencia: null, dias_sin_venir: 40, telefono: null }),
];

const tramo = (nombre: RegExp) => screen.getByRole('button', { name: nombre });

describe('AlumnosEnRiesgoCard', () => {
  beforeEach(() => {
    mockedHook.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { registra_asistencias: true, activos: 50, items: ITEMS },
    });
  });

  it('muestra el total y cuántos alumnos hay en cada tramo de urgencia', () => {
    render(<AlumnosEnRiesgoCard />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText(/de 50 activos \(10%\)/i)).toBeInTheDocument();
    expect(tramo(/14.30 días/i)).toHaveTextContent('2');
    expect(tramo(/30.60 días/i)).toHaveTextContent('1');
    expect(tramo(/\+60 días/i)).toHaveTextContent('1');
    expect(tramo(/nunca vino/i)).toHaveTextContent('1');
    // La lista no se muestra hasta tocar un tramo.
    expect(screen.queryByText('Ana López')).not.toBeInTheDocument();
  });

  it('al tocar un tramo abre un modal solo con esos alumnos y su WhatsApp', async () => {
    const user = userEvent.setup();
    render(<AlumnosEnRiesgoCard />);

    await user.click(tramo(/14.30 días/i));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Ana López')).toBeInTheDocument();
    expect(within(dialog).getByText('Beto Díaz')).toBeInTheDocument();
    expect(within(dialog).queryByText('Carla Paz')).not.toBeInTheDocument();

    const ana = within(dialog).getByText('Ana López').closest('li') as HTMLElement;
    expect(within(ana).getByText(/20 días sin venir/i)).toBeInTheDocument();
    expect(within(ana).getByRole('link', { name: /whatsapp/i })).toHaveAttribute(
      'href',
      expect.stringContaining('https://wa.me/5493511234567'),
    );
  });

  it('el tramo "nunca vino" lista a quienes no tienen asistencias', async () => {
    const user = userEvent.setup();
    render(<AlumnosEnRiesgoCard />);

    await user.click(tramo(/nunca vino/i));

    const dialog = await screen.findByRole('dialog');
    const eli = within(dialog).getByText('Eli Sosa').closest('li') as HTMLElement;
    expect(within(eli).queryByRole('link', { name: /whatsapp/i })).not.toBeInTheDocument();
  });

  it('usa la misma tarjeta elevada que los otros gráficos (gris en modo oscuro), no la outlined', () => {
    const { container } = render(<AlumnosEnRiesgoCard />);

    const card = container.querySelector('.MuiCard-root') as HTMLElement;
    expect(card).toHaveClass('MuiPaper-elevation');
    expect(card).not.toHaveClass('MuiPaper-outlined');
  });

  it('avisa cuando el gym no registra asistencias en vez de mostrar el resumen', () => {
    mockedHook.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { registra_asistencias: false, activos: 30, items: ITEMS },
    });

    render(<AlumnosEnRiesgoCard />);

    expect(screen.getByText(/no se registraron asistencias/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /14.30 días/i })).not.toBeInTheDocument();
  });

  it('muestra un mensaje cuando nadie está en riesgo', () => {
    mockedHook.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { registra_asistencias: true, activos: 30, items: [] },
    });

    render(<AlumnosEnRiesgoCard />);

    expect(screen.getByText(/ningún alumno en riesgo/i)).toBeInTheDocument();
  });
});
