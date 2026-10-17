import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';

jest.mock('@/lib/api', () => ({
  api: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

jest.mock('@/lib/toast', () => ({
  notify: { success: jest.fn(), error: jest.fn(), info: jest.fn(), warning: jest.fn(), default: jest.fn() },
}));

import { api } from '@/lib/api';
import { GymDetailDrawer } from '@/components/owner/GymDetailDrawer';
import type { Gym } from '@/hooks/gyms/useGyms';

const mockedApi = api as jest.Mocked<typeof api>;

const gym = { id: 'gym-1', name: 'Gym Centro' } as Gym;

function renderDrawer() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <GymDetailDrawer gym={gym} open onClose={() => {}} />
    </QueryClientProvider>
  );
}

describe('GymDetailDrawer > Usuarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // DetailsTab / SubscriptionTab usan fetch; devolvemos vacío para que no rompan.
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] }) as jest.Mock;
    mockedApi.get.mockResolvedValue({ data: [] });
    mockedApi.post.mockResolvedValue({ data: { message: 'Usuario registrado' } });
  });

  it('crea un usuario para el gym abierto y recarga la lista', async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.click(screen.getByRole('tab', { name: /usuarios/i }));
    await user.click(await screen.findByRole('button', { name: /agregar usuario/i }));

    await user.type(screen.getByLabelText(/nombre y apellido/i), 'Ana López');
    await user.type(screen.getByLabelText(/dni/i), '30111222');
    await user.type(screen.getByLabelText(/email/i), 'ana@gym.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'secreta123');

    const getsAntes = mockedApi.get.mock.calls.length;
    await user.click(screen.getByRole('button', { name: /^crear usuario$/i }));

    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith('/api/auth/register', {
        name: 'Ana López',
        dni: 30111222,
        email: 'ana@gym.com',
        password: 'secreta123',
        gym_id: 'gym-1',
        role_id: 3,
      })
    );
    await waitFor(() => expect(mockedApi.get.mock.calls.length).toBeGreaterThan(getsAntes));
  });

  it('muestra el error que devuelve el backend', async () => {
    mockedApi.post.mockRejectedValueOnce({
      response: { status: 400, data: { error: 'Ya existe un usuario registrado con este correo electrónico' } },
    });
    const user = userEvent.setup();
    renderDrawer();

    await user.click(screen.getByRole('tab', { name: /usuarios/i }));
    await user.click(await screen.findByRole('button', { name: /agregar usuario/i }));
    await user.type(screen.getByLabelText(/nombre y apellido/i), 'Ana López');
    await user.type(screen.getByLabelText(/dni/i), '30111222');
    await user.type(screen.getByLabelText(/email/i), 'ana@gym.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'secreta123');
    await user.click(screen.getByRole('button', { name: /^crear usuario$/i }));

    expect(await screen.findByText(/ya existe un usuario registrado/i)).toBeInTheDocument();
  });

  it('no envía si faltan campos', async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.click(screen.getByRole('tab', { name: /usuarios/i }));
    await user.click(await screen.findByRole('button', { name: /agregar usuario/i }));
    await user.click(screen.getByRole('button', { name: /^crear usuario$/i }));

    expect(await screen.findByText(/completá todos los campos/i)).toBeInTheDocument();
    expect(mockedApi.post).not.toHaveBeenCalled();
  });
});
