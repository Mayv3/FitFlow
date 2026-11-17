import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

jest.mock('@/hooks/dashboard/useAsistenciasHeatmap', () => ({
  useAsistenciasHeatmap: jest.fn(),
}));

import { useAsistenciasHeatmap } from '@/hooks/dashboard/useAsistenciasHeatmap';
import { AsistenciasHeatmapCard, armarGrilla } from '@/components/dashboard/adminStats/AsistenciasHeatmapCard';

const mockedHook = useAsistenciasHeatmap as jest.Mock;

const FILAS = [
  { dia: 1, hora: 8, total: 45 },
  { dia: 3, hora: 19, total: 90 },
  { dia: 6, hora: 10, total: 35 },
  { dia: 2, hora: 6, total: 48 },
];

describe('armarGrilla', () => {
  it('toma las horas desde la primera hasta la última con actividad, sin huecos', () => {
    const g = armarGrilla(FILAS);
    expect(g.horas).toEqual([6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
  });

  it('devuelve el valor de cada celda, 0 si no hubo asistencias', () => {
    const g = armarGrilla(FILAS);
    expect(g.valor(3, 19)).toBe(90);
    expect(g.valor(7, 19)).toBe(0);
  });

  it('calcula el máximo, el total y el horario pico', () => {
    const g = armarGrilla(FILAS);
    expect(g.max).toBe(90);
    expect(g.total).toBe(218);
    expect(g.pico).toEqual({ dia: 3, hora: 19, total: 90 });
  });

  it('sin datos no tiene horas ni pico', () => {
    const g = armarGrilla([]);
    expect(g.horas).toEqual([]);
    expect(g.pico).toBeNull();
  });
});

describe('AsistenciasHeatmapCard', () => {
  beforeEach(() => {
    mockedHook.mockReset();
    mockedHook.mockReturnValue({ isLoading: false, isError: false, data: FILAS });
  });

  it('muestra el horario pico y una celda por día y hora con su cantidad', () => {
    render(<AsistenciasHeatmapCard />);

    expect(screen.getByText(/horario pico/i)).toHaveTextContent(/miércoles de 19:00 a 20:00 · 90 asistencias/i);
    expect(screen.getByLabelText('Miércoles de 19:00 a 20:00: 90 asistencias')).toBeInTheDocument();
    expect(screen.getByLabelText('Domingo de 19:00 a 20:00: 0 asistencias')).toBeInTheDocument();
    // 7 días × 14 horas
    expect(screen.getAllByLabelText(/de \d{2}:00 a \d{2}:00: \d+ asistencias/)).toHaveLength(98);
  });

  it('rotula las columnas como horas de entrada en formato HH:00', () => {
    render(<AsistenciasHeatmapCard />);

    expect(screen.getByText('Hora de entrada')).toBeInTheDocument();
    expect(screen.getByText('06:00')).toBeInTheDocument();
    expect(screen.getByText('19:00')).toBeInTheDocument();
  });

  it('pide el período elegido al cambiar el mes', async () => {
    const user = userEvent.setup();
    render(<AsistenciasHeatmapCard />);

    await user.click(screen.getByRole('combobox', { name: /mes/i }));
    await user.click(screen.getByRole('option', { name: /todo el año/i }));

    const [, month] = mockedHook.mock.calls[mockedHook.mock.calls.length - 1];
    expect(month).toBe(0);
  });

  it('muestra un mensaje si no hay asistencias en el período', () => {
    mockedHook.mockReturnValue({ isLoading: false, isError: false, data: [] });

    render(<AsistenciasHeatmapCard />);

    expect(screen.getByText(/no hay asistencias registradas/i)).toBeInTheDocument();
  });
});
