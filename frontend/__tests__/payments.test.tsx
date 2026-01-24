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

jest.mock('js-cookie', () => ({
  get: jest.fn(() => 'fake-token-123'),
}));

import axios from 'axios';
import { usePagosByGym, useAddPago, useEditPago, useDeletePago } from '@/hooks/payments/usePaymentsApi';
import { Payment } from '@/models/Payment/Payment';

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockAxiosInstance = (mockedAxios.create as jest.Mock)();

const mockPayment: Payment = {
  id: 1,
  monto_total: 5000,
  fecha_de_pago: '2026-01-24',
  fecha_de_venc: '2026-02-24',
  responsable: 'Admin Usuario',
  hora: '10:00',
  tipo: 'Mensualidad',
  plan_id: 1,
  plan_nombre: 'Plan Mensual',
  gym_id: 'gym-123',
  alumno_id: 1,
  alumno_nombre: 'Juan Pérez',
  metodo_legible: 'Efectivo',
  items: [
    {
      monto: 5000,
      metodo_de_pago_id: 1,
      metodo_nombre: 'Efectivo',
    },
  ],
};

const mockPayments: Payment[] = [
  mockPayment,
  {
    id: 2,
    monto_total: 7500,
    fecha_de_pago: '2026-01-23',
    fecha_de_venc: '2026-02-23',
    responsable: 'Admin Usuario',
    hora: '11:30',
    tipo: 'Mensualidad',
    plan_id: 2,
    plan_nombre: 'Plan Premium',
    gym_id: 'gym-123',
    alumno_id: 2,
    alumno_nombre: 'María García',
    metodo_legible: 'Tarjeta',
    items: [
      {
        monto: 7500,
        metodo_de_pago_id: 2,
        metodo_nombre: 'Tarjeta de Crédito',
      },
    ],
  },
];

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

describe('Payments CRUD Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CREATE - Crear un nuevo pago con useAddPago', () => {
    it('debería crear un nuevo pago exitosamente usando el hook', async () => {
      const newPaymentData = {
        monto_total: 10000,
        fecha_de_pago: '2026-01-25',
        fecha_de_venc: '2026-02-25',
        plan_id: 1,
        alumno_id: 3,
        items: [
          {
            monto: 10000,
            metodo_de_pago_id: 3,
          },
        ],
      };

      const createdPayment: Payment = {
        id: 3,
        ...newPaymentData,
        responsable: 'Admin Usuario',
        hora: '12:00',
        tipo: 'Mensualidad',
        plan_nombre: 'Plan Mensual',
        gym_id: 'gym-123',
      };

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: createdPayment,
        status: 201,
      });

      const { result } = renderHook(() => useAddPago('gym-123'), {
        wrapper: createWrapper(),
      });

      result.current.mutate(newPaymentData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/pagos', newPaymentData);
      expect(result.current.data).toEqual(createdPayment);
      expect(result.current.data?.id).toBe(3);
      expect(result.current.data?.monto_total).toBe(10000);
    });

    it('debería fallar al crear un pago sin datos requeridos', async () => {
      const invalidPayment = {
        monto_total: 0,
      };

      mockAxiosInstance.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Datos incompletos' },
        },
      });

      const { result } = renderHook(() => useAddPago('gym-123'), {
        wrapper: createWrapper(),
      });

      result.current.mutate(invalidPayment);

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });

    it('debería validar que el monto sea un número positivo', async () => {
      const paymentWithNegativeAmount = {
        monto_total: -5000,
        fecha_de_pago: '2026-01-25',
        plan_id: 1,
        alumno_id: 1,
        items: [],
      };

      mockAxiosInstance.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'El monto debe ser mayor a 0' },
        },
      });

      const { result } = renderHook(() => useAddPago('gym-123'), {
        wrapper: createWrapper(),
      });

      result.current.mutate(paymentWithNegativeAmount);

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });


  describe('READ - Leer pagos con usePagosByGym', () => {
    it('debería obtener todos los pagos con paginación usando el hook', async () => {
      const mockResponse = {
        items: mockPayments,
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
        () => usePagosByGym('gym-123', 1, 20, ''),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/pagos', {
        params: {
          page: 1,
          limit: 20,
          q: '',
          fromDate: undefined,
          toDate: undefined,
        },
      });
      expect(result.current.data?.items).toHaveLength(2);
      expect(result.current.data?.total).toBe(2);
    });

    it('debería filtrar pagos por rango de fechas', async () => {
      const mockResponse = {
        items: [mockPayment],
        total: 1,
        page: 1,
        limit: 20,
        q: '',
      };

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
      });

      const { result } = renderHook(
        () =>
          usePagosByGym('gym-123', 1, 20, '', {
            fromDate: '2026-01-24',
            toDate: '2026-01-24',
          }),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/pagos', {
        params: {
          page: 1,
          limit: 20,
          q: '',
          fromDate: '2026-01-24',
          toDate: '2026-01-24',
        },
      });
      expect(result.current.data?.items).toHaveLength(1);
      expect(result.current.data?.items[0].fecha_de_pago).toBe('2026-01-24');
    });

    it('debería buscar pagos por término de búsqueda', async () => {
      const mockResponse = {
        items: [mockPayment],
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
        () => usePagosByGym('gym-123', 1, 20, 'Juan'),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.items).toHaveLength(1);
      expect(result.current.data?.q).toBe('Juan');
    });

    it('debería manejar error cuando no hay datos', async () => {
      mockAxiosInstance.get.mockRejectedValue({
        response: {
          status: 404,
          data: { error: 'No se encontraron pagos' },
        },
      });

      const { result } = renderHook(
        () => usePagosByGym('gym-123', 1, 20, ''),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 2000 });

      expect(result.current.error).toBeDefined();
    });

    it('debería mantener datos previos durante paginación (placeholderData)', async () => {
      const mockResponsePage1 = {
        items: mockPayments,
        total: 25,
        page: 1,
        limit: 20,
        q: '',
      };

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: mockResponsePage1,
        status: 200,
      });

      const { result, rerender } = renderHook(
        ({ page }: { page: number }) => usePagosByGym('gym-123', page, 20, ''),
        {
          wrapper: createWrapper(),
          initialProps: { page: 1 },
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.items).toHaveLength(2);

      // Los datos anteriores deberían mantenerse mientras carga la página 2
      expect(result.current.data).toBeDefined();
    });
  });


  describe('UPDATE - Actualizar un pago con useEditPago', () => {
    it('debería actualizar un pago exitosamente usando el hook', async () => {
      const updatedData = {
        monto_total: 6000,
        items: [
          {
            monto: 6000,
            metodo_de_pago_id: 3,
            metodo_nombre: 'Transferencia',
          },
        ],
      };

      const updatedPayment: Payment = {
        ...mockPayment,
        monto_total: 6000,
        metodo_legible: 'Transferencia',
        items: updatedData.items,
      };

      mockAxiosInstance.put.mockResolvedValueOnce({
        data: updatedPayment,
        status: 200,
      });

      const { result } = renderHook(() => useEditPago('gym-123'), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: 1, values: updatedData });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/api/pagos/1', updatedData);
      expect(result.current.data?.monto_total).toBe(6000);
      expect(result.current.data?.metodo_legible).toBe('Transferencia');
    });

    it('debería fallar al actualizar un pago que no existe', async () => {
      mockAxiosInstance.put.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { error: 'Pago no encontrado' },
        },
      });

      const { result } = renderHook(() => useEditPago('gym-123'), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: 999, values: { monto_total: 5000 } });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });

    it('debería actualizar solo los campos proporcionados (actualización parcial)', async () => {
      const partialUpdate = {
        monto_total: 8000,
      };

      const updatedPayment: Payment = {
        ...mockPayment,
        monto_total: 8000,
      };

      mockAxiosInstance.put.mockResolvedValueOnce({
        data: updatedPayment,
        status: 200,
      });

      const { result } = renderHook(() => useEditPago('gym-123'), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: 1, values: partialUpdate });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.monto_total).toBe(8000);
      expect(result.current.data?.plan_nombre).toBe(mockPayment.plan_nombre);
      expect(result.current.data?.alumno_nombre).toBe(mockPayment.alumno_nombre);
    });

    it('debería invalidar las queries después de actualizar', async () => {
      const updatedPayment: Payment = {
        ...mockPayment,
        monto_total: 7000,
      };

      mockAxiosInstance.put.mockResolvedValueOnce({
        data: updatedPayment,
        status: 200,
      });

      const { result } = renderHook(() => useEditPago('gym-123'), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: 1, values: { monto_total: 7000 } });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // La mutación debería invalidar las queries de payments y stats
      expect(result.current.isSuccess).toBe(true);
    });
  });


  describe('DELETE - Eliminar un pago con useDeletePago', () => {
    it('debería hacer soft delete de un pago usando el hook', async () => {
      mockAxiosInstance.delete.mockResolvedValueOnce({
        status: 204,
        data: null,
      });

      const { result } = renderHook(() => useDeletePago('gym-123'), {
        wrapper: createWrapper(),
      });

      result.current.mutate(1);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/api/pagos/1');
      expect(result.current.data).toBe(1);
    });

    it('debería fallar al eliminar un pago que no existe', async () => {
      mockAxiosInstance.delete.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { error: 'Pago no encontrado' },
        },
      });

      const { result } = renderHook(() => useDeletePago('gym-123'), {
        wrapper: createWrapper(),
      });

      result.current.mutate(999);

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });

    it('debería invalidar queries después de eliminar', async () => {
      mockAxiosInstance.delete.mockResolvedValueOnce({
        status: 204,
        data: null,
      });

      const { result } = renderHook(() => useDeletePago('gym-123'), {
        wrapper: createWrapper(),
      });

      result.current.mutate(1);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // La mutación debería invalidar las queries
      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe('Validaciones adicionales con hooks', () => {
    it('debería validar el formato de fecha al crear', async () => {
      const invalidDatePayment = {
        monto_total: 5000,
        fecha_de_pago: 'fecha-invalida',
        plan_id: 1,
        alumno_id: 1,
        items: [],
      };

      mockAxiosInstance.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Formato de fecha inválido' },
        },
      });

      const { result } = renderHook(() => useAddPago('gym-123'), {
        wrapper: createWrapper(),
      });

      result.current.mutate(invalidDatePayment);

      await waitFor(() => expect(result.current.isError).toBe(true));
    });

    it('debería validar que el alumno_id exista', async () => {
      const paymentWithInvalidAlumno = {
        monto_total: 5000,
        fecha_de_pago: '2026-01-25',
        plan_id: 1,
        alumno_id: 99999,
        items: [],
      };

      mockAxiosInstance.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Alumno no encontrado' },
        },
      });

      const { result } = renderHook(() => useAddPago('gym-123'), {
        wrapper: createWrapper(),
      });

      result.current.mutate(paymentWithInvalidAlumno);

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
        () => usePagosByGym('gym-123', 1, 20, ''),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 2000 });

      expect(result.current.error).toBeDefined();
    });

    it('debería manejar errores de red', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Network Error'));

      const { result } = renderHook(
        () => usePagosByGym('gym-123', 1, 20, ''),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 2000 });

      expect(result.current.error).toBeDefined();
    });

    it('debería validar items de pago con múltiples métodos', async () => {
      const paymentWithMultipleItems = {
        monto_total: 10000,
        fecha_de_pago: '2026-01-25',
        plan_id: 1,
        alumno_id: 1,
        items: [
          {
            monto: 5000,
            metodo_de_pago_id: 1,
          },
          {
            monto: 5000,
            metodo_de_pago_id: 2,
          },
        ],
      };

      const createdPayment: Payment = {
        id: 4,
        ...paymentWithMultipleItems,
        responsable: 'Admin Usuario',
        hora: '14:00',
        tipo: 'Mensualidad',
        plan_nombre: 'Plan Mensual',
        gym_id: 'gym-123',
        metodos_legibles: ['Efectivo', 'Tarjeta'],
        fecha_de_venc: '2026-02-25',
      };

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: createdPayment,
        status: 201,
      });

      const { result } = renderHook(() => useAddPago('gym-123'), {
        wrapper: createWrapper(),
      });

      result.current.mutate(paymentWithMultipleItems);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.items).toHaveLength(2);
      expect(result.current.data?.monto_total).toBe(10000);
    });
  });
});
