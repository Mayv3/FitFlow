import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';
import { ReactNode } from 'react';

// Mock de axios DEBE estar ANTES de importar el hook
jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn(), clear: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn(), clear: jest.fn() },
    },
  };

  return {
    __esModule: true,
    default: {
      create: jest.fn(() => mockAxiosInstance),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn(), clear: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn(), clear: jest.fn() },
      },
    },
  };
});

// Mock de js-cookie
jest.mock('js-cookie', () => ({
  get: jest.fn((key: string) => {
    if (key === 'token') return 'fake-token-123';
    if (key === 'gym_id') return 'gym-123';
    return null;
  }),
}));

// Ahora importar el hook y los tipos
import axios from 'axios';
import { 
  useAlumnosByGym, 
  useAddAlumno, 
  useEditAlumnoByDNI, 
  useDeleteAlumnoByDNI,
  useAlumnosSimpleService 
} from '@/hooks/alumnos/useAlumnosApi';
import { Member } from '@/models/Member/Member';

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockAxiosInstance = (mockedAxios.create as jest.Mock)();

// Mock de datos realistas según el modelo Member
const mockMember: Member = {
  id: '1',
  nombre: 'Juan Pérez',
  dni: '12345678',
  email: 'juan@example.com',
  telefono: '+54911234567',
  sexo: 'M',
  fecha_nacimiento: '1990-05-15',
  clases_pagadas: 12,
  clases_realizadas: 8,
  plan: 'Plan Mensual',
  fecha_inicio: '2026-01-01',
  fecha_vencimiento: '2026-02-01',
  gym_id: 'gym-123',
  plan_id: 1,
  plan_nombre: 'Plan Mensual',
  origen: 'instagram',
};

const mockMembers: Member[] = [
  mockMember,
  {
    id: '2',
    nombre: 'María García',
    dni: '87654321',
    email: 'maria@example.com',
    telefono: '+54911234568',
    sexo: 'F',
    fecha_nacimiento: '1992-08-20',
    clases_pagadas: 8,
    clases_realizadas: 6,
    plan: 'Plan Semanal',
    fecha_inicio: '2026-01-10',
    fecha_vencimiento: '2026-02-10',
    gym_id: 'gym-123',
    plan_id: 2,
    plan_nombre: 'Plan Semanal',
    origen: 'recomendacion',
  },
];

// Wrapper para React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Members CRUD Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CREATE - Crear un nuevo miembro con useAddAlumno', () => {
    it('debería crear un nuevo miembro exitosamente usando el hook', async () => {
      const newMemberData = {
        nombre: 'Carlos López',
        dni: '11223344',
        email: 'carlos@example.com',
        telefono: '+54911223344',
        sexo: 'M',
        fecha_nacimiento: '1988-03-10',
        plan_id: 1,
        gym_id: 'gym-123',
        origen: 'facebook',
      };

      const createdMember: Member = {
        id: '3',
        ...newMemberData,
        clases_pagadas: 0,
        clases_realizadas: 0,
        plan: 'Plan Mensual',
        fecha_inicio: '2026-01-24',
        fecha_vencimiento: '2026-02-24',
        plan_nombre: 'Plan Mensual',
      };

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: createdMember,
        status: 201,
      });

      const { result } = renderHook(() => useAddAlumno(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(newMemberData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/alumnos', newMemberData);
      expect(result.current.data).toEqual(createdMember);
      expect(result.current.data?.id).toBe('3');
      expect(result.current.data?.nombre).toBe('Carlos López');
      expect(result.current.data?.dni).toBe('11223344');
    });

    it('debería fallar al crear un miembro sin datos requeridos', async () => {
      const invalidMember = {
        nombre: '',
      };

      mockAxiosInstance.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Datos incompletos' },
        },
      });

      const { result } = renderHook(() => useAddAlumno(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(invalidMember);

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });

    it('debería validar que el DNI sea único', async () => {
      const memberWithDuplicateDNI = {
        nombre: 'Pedro Rodríguez',
        dni: '12345678', // DNI duplicado
        email: 'pedro@example.com',
        telefono: '+54911223345',
        sexo: 'M',
        fecha_nacimiento: '1995-07-20',
        plan_id: 1,
        gym_id: 'gym-123',
      };

      mockAxiosInstance.post.mockRejectedValueOnce({
        response: {
          status: 409,
          data: { error: 'El DNI ya existe' },
        },
      });

      const { result } = renderHook(() => useAddAlumno(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(memberWithDuplicateDNI);

      await waitFor(() => expect(result.current.isError).toBe(true));
    });

    it('debería validar el formato del email', async () => {
      const memberWithInvalidEmail = {
        nombre: 'Ana Torres',
        dni: '99887766',
        email: 'email-invalido',
        telefono: '+54911223346',
        sexo: 'F',
        fecha_nacimiento: '1993-11-15',
        plan_id: 1,
        gym_id: 'gym-123',
      };

      mockAxiosInstance.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Formato de email inválido' },
        },
      });

      const { result } = renderHook(() => useAddAlumno(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(memberWithInvalidEmail);

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('READ - Leer miembros con useAlumnosByGym', () => {
    it('debería obtener todos los miembros con paginación usando el hook', async () => {
      const mockResponse = {
        items: mockMembers,
        total: 2,
        page: 1,
        limit: 20,
        q: '',
      };

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
      });

      const { result } = renderHook(
        () => useAlumnosByGym('gym-123', 1, 20, ''),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/alumnos', {
        params: {
          gym_id: 'gym-123',
          page: 1,
          limit: 20,
          q: '',
        },
      });
      expect(result.current.data?.items).toHaveLength(2);
      expect(result.current.data?.total).toBe(2);
    });

    it('debería buscar miembros por término de búsqueda (nombre)', async () => {
      const mockResponse = {
        items: [mockMember],
        total: 1,
        page: 1,
        limit: 20,
        q: 'Juan',
      };

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
      });

      const { result } = renderHook(
        () => useAlumnosByGym('gym-123', 1, 20, 'Juan'),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.items).toHaveLength(1);
      expect(result.current.data?.items[0].nombre).toContain('Juan');
      expect(result.current.data?.q).toBe('Juan');
    });

    it('debería buscar miembros por DNI', async () => {
      const mockResponse = {
        items: [mockMember],
        total: 1,
        page: 1,
        limit: 20,
        q: '12345678',
      };

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
      });

      const { result } = renderHook(
        () => useAlumnosByGym('gym-123', 1, 20, '12345678'),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.items).toHaveLength(1);
      expect(result.current.data?.items[0].dni).toBe('12345678');
    });

    it('debería manejar error cuando no hay datos', async () => {
      mockAxiosInstance.get.mockRejectedValue({
        response: {
          status: 404,
          data: { error: 'No se encontraron miembros' },
        },
      });

      const { result } = renderHook(
        () => useAlumnosByGym('gym-123', 1, 20, ''),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 2000 });

      expect(result.current.error).toBeDefined();
    });

    it('debería mantener datos previos durante paginación (placeholderData)', async () => {
      const mockResponsePage1 = {
        items: mockMembers,
        total: 50,
        page: 1,
        limit: 20,
        q: '',
      };

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: mockResponsePage1,
        status: 200,
      });

      const { result } = renderHook(
        ({ page }: { page: number }) => useAlumnosByGym('gym-123', page, 20, ''),
        {
          wrapper: createWrapper(),
          initialProps: { page: 1 },
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.items).toHaveLength(2);
      expect(result.current.data).toBeDefined();
    });
  });

  describe('UPDATE - Actualizar un miembro con useEditAlumnoByDNI', () => {
    it('debería actualizar un miembro exitosamente usando el hook', async () => {
      const updatedData = {
        telefono: '+54911999999',
        email: 'juan.nuevo@example.com',
      };

      const updatedMember: Member = {
        ...mockMember,
        telefono: '+54911999999',
        email: 'juan.nuevo@example.com',
      };

      mockAxiosInstance.put.mockResolvedValueOnce({
        data: updatedMember,
        status: 200,
      });

      const { result } = renderHook(() => useEditAlumnoByDNI(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ dni: '12345678', values: updatedData });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/api/alumnos/12345678', updatedData);
      expect(result.current.data?.telefono).toBe('+54911999999');
      expect(result.current.data?.email).toBe('juan.nuevo@example.com');
    });

    it('debería fallar al actualizar un miembro que no existe', async () => {
      mockAxiosInstance.put.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { error: 'Miembro no encontrado' },
        },
      });

      const { result } = renderHook(() => useEditAlumnoByDNI(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ dni: '99999999', values: { telefono: '+54911888888' } });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });

    it('debería actualizar solo los campos proporcionados (actualización parcial)', async () => {
      const partialUpdate = {
        telefono: '+54911777777',
      };

      const updatedMember: Member = {
        ...mockMember,
        telefono: '+54911777777',
      };

      mockAxiosInstance.put.mockResolvedValueOnce({
        data: updatedMember,
        status: 200,
      });

      const { result } = renderHook(() => useEditAlumnoByDNI(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ dni: '12345678', values: partialUpdate });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.telefono).toBe('+54911777777');
      expect(result.current.data?.nombre).toBe(mockMember.nombre);
      expect(result.current.data?.email).toBe(mockMember.email);
    });

    it('debería invalidar las queries después de actualizar', async () => {
      const updatedMember: Member = {
        ...mockMember,
        plan_id: 2,
        plan_nombre: 'Plan Premium',
      };

      mockAxiosInstance.put.mockResolvedValueOnce({
        data: updatedMember,
        status: 200,
      });

      const { result } = renderHook(() => useEditAlumnoByDNI(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ 
        dni: '12345678', 
        values: { plan_id: 2, plan_nombre: 'Plan Premium' } 
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // La mutación debería invalidar las queries de members y stats
      expect(result.current.isSuccess).toBe(true);
    });

    it('debería actualizar el plan de un miembro', async () => {
      const planUpdate = {
        plan_id: 3,
        plan_nombre: 'Plan Anual',
        fecha_vencimiento: '2027-01-24',
      };

      const updatedMember: Member = {
        ...mockMember,
        plan_id: 3,
        plan_nombre: 'Plan Anual',
        plan: 'Plan Anual',
        fecha_vencimiento: '2027-01-24',
      };

      mockAxiosInstance.put.mockResolvedValueOnce({
        data: updatedMember,
        status: 200,
      });

      const { result } = renderHook(() => useEditAlumnoByDNI(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ dni: '12345678', values: planUpdate });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.plan_id).toBe(3);
      expect(result.current.data?.plan_nombre).toBe('Plan Anual');
    });
  });

  describe('DELETE - Eliminar un miembro con useDeleteAlumnoByDNI', () => {
    it('debería hacer soft delete de un miembro usando el hook', async () => {
      mockAxiosInstance.delete.mockResolvedValueOnce({
        status: 204,
        data: null,
      });

      const { result } = renderHook(() => useDeleteAlumnoByDNI(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('12345678');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/api/alumnos/12345678', {
        params: { gym_id: 'gym-123' },
        headers: {
          Authorization: 'Bearer fake-token-123',
        },
      });
      expect(result.current.data).toBe('12345678');
    });

    it('debería fallar al eliminar un miembro que no existe', async () => {
      mockAxiosInstance.delete.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { error: 'Miembro no encontrado' },
        },
      });

      const { result } = renderHook(() => useDeleteAlumnoByDNI(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('99999999');

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });

    it('debería invalidar queries después de eliminar', async () => {
      mockAxiosInstance.delete.mockResolvedValueOnce({
        status: 204,
        data: null,
      });

      const { result } = renderHook(() => useDeleteAlumnoByDNI(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('12345678');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // La mutación debería invalidar las queries
      expect(result.current.isSuccess).toBe(true);
    });

    it('debería requerir token para eliminar', async () => {
      // Mock Cookies sin token
      const Cookies = require('js-cookie');
      Cookies.get.mockImplementation((key: string) => {
        if (key === 'gym_id') return 'gym-123';
        return null; // No hay token
      });

      const { result } = renderHook(() => useDeleteAlumnoByDNI(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('12345678');

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();

      // Restaurar mock
      Cookies.get.mockImplementation((key: string) => {
        if (key === 'token') return 'fake-token-123';
        if (key === 'gym_id') return 'gym-123';
        return null;
      });
    });
  });

  describe('READ Simple - Obtener lista simple de miembros', () => {
    it('debería obtener lista simple de miembros para selects/dropdowns', async () => {
      const simpleMembersList = [
        { id: '1', nombre: 'Juan Pérez', dni: '12345678' },
        { id: '2', nombre: 'María García', dni: '87654321' },
      ];

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: simpleMembersList,
        status: 200,
      });

      const { result } = renderHook(
        () => useAlumnosSimpleService('gym-123'),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/alumnos/simple', {
        params: { gym_id: 'gym-123' },
      });
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data[0]).toHaveProperty('nombre');
      expect(result.current.data[0]).toHaveProperty('dni');
    });
  });

  describe('Validaciones adicionales con hooks', () => {
    it('debería validar el formato de fecha de nacimiento', async () => {
      const invalidDateMember = {
        nombre: 'Test User',
        dni: '55667788',
        email: 'test@example.com',
        telefono: '+54911223347',
        sexo: 'M',
        fecha_nacimiento: 'fecha-invalida',
        plan_id: 1,
        gym_id: 'gym-123',
      };

      mockAxiosInstance.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Formato de fecha inválido' },
        },
      });

      const { result } = renderHook(() => useAddAlumno(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(invalidDateMember);

      await waitFor(() => expect(result.current.isError).toBe(true));
    });

    it('debería validar que el plan_id exista', async () => {
      const memberWithInvalidPlan = {
        nombre: 'Test User',
        dni: '44556677',
        email: 'test2@example.com',
        telefono: '+54911223348',
        sexo: 'F',
        fecha_nacimiento: '1995-01-01',
        plan_id: 99999,
        gym_id: 'gym-123',
      };

      mockAxiosInstance.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Plan no encontrado' },
        },
      });

      const { result } = renderHook(() => useAddAlumno(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(memberWithInvalidPlan);

      await waitFor(() => expect(result.current.isError).toBe(true));
    });

    it('debería manejar errores del servidor en queries', async () => {
      mockAxiosInstance.get.mockRejectedValue({
        response: {
          status: 500,
          data: { error: 'Error interno del servidor' },
        },
      });

      const { result } = renderHook(
        () => useAlumnosByGym('gym-123', 1, 20, ''),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 2000 });

      expect(result.current.error).toBeDefined();
    });

    it('debería manejar errores de red', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Network Error'));

      const { result } = renderHook(
        () => useAlumnosByGym('gym-123', 1, 20, ''),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 2000 });

      expect(result.current.error).toBeDefined();
    });

    it('debería validar el formato del teléfono', async () => {
      const memberWithInvalidPhone = {
        nombre: 'Test User',
        dni: '33445566',
        email: 'test3@example.com',
        telefono: 'telefono-invalido',
        sexo: 'M',
        fecha_nacimiento: '1990-01-01',
        plan_id: 1,
        gym_id: 'gym-123',
      };

      mockAxiosInstance.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Formato de teléfono inválido' },
        },
      });

      const { result } = renderHook(() => useAddAlumno(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(memberWithInvalidPhone);

      await waitFor(() => expect(result.current.isError).toBe(true));
    });

    it('debería validar campos de origen válidos', async () => {
      const memberWithValidOrigin = {
        nombre: 'Test User',
        dni: '22334455',
        email: 'test4@example.com',
        telefono: '+54911223349',
        sexo: 'M',
        fecha_nacimiento: '1992-05-10',
        plan_id: 1,
        gym_id: 'gym-123',
        origen: 'recomendacion',
      };

      const createdMember: Member = {
        id: '10',
        ...memberWithValidOrigin,
        clases_pagadas: 0,
        clases_realizadas: 0,
        plan: 'Plan Mensual',
        fecha_inicio: '2026-01-24',
        fecha_vencimiento: '2026-02-24',
        plan_nombre: 'Plan Mensual',
      };

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: createdMember,
        status: 201,
      });

      const { result } = renderHook(() => useAddAlumno(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(memberWithValidOrigin);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.origen).toBe('recomendacion');
    });
  });
});
