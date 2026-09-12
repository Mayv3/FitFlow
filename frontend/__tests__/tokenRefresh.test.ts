// Mocks DEBEN estar ANTES de importar el módulo bajo test
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

jest.mock('js-cookie', () => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
}));

import axios from 'axios';
import Cookies from 'js-cookie';
import { getJwtExpiryMs, refreshAccessToken } from '@/lib/auth/tokenRefresh';

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedCookiesGet = Cookies.get as jest.Mock;
const mockedCookiesSet = Cookies.set as jest.Mock;
const mockedCookiesRemove = Cookies.remove as jest.Mock;

function makeJwt(payload: object) {
  const base64url = (obj: object) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

  return `${base64url({ alg: 'none' })}.${base64url(payload)}.signature`;
}

describe('getJwtExpiryMs', () => {
  it('decodifica el claim exp (segundos) y lo devuelve en milisegundos', () => {
    const token = makeJwt({ exp: 1700000000 });
    expect(getJwtExpiryMs(token)).toBe(1700000000 * 1000);
  });

  it('devuelve null si el token no tiene formato JWT válido', () => {
    expect(getJwtExpiryMs('no-es-un-jwt')).toBeNull();
  });

  it('devuelve null si el payload no tiene un exp numérico', () => {
    const token = makeJwt({ sub: 'user-1' });
    expect(getJwtExpiryMs(token)).toBeNull();
  });
});

describe('refreshAccessToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devuelve null sin llamar al backend si no hay refresh_token guardado', async () => {
    mockedCookiesGet.mockReturnValue(undefined);

    const result = await refreshAccessToken();

    expect(result).toBeNull();
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('pide un access_token nuevo, persiste la sesión y lo devuelve', async () => {
    mockedCookiesGet.mockReturnValue('refresh-token-abc');
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        session: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
        },
      },
    });

    const result = await refreshAccessToken();

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/refresh'),
      { refresh_token: 'refresh-token-abc' }
    );
    expect(mockedCookiesSet).toHaveBeenCalledWith('token', 'new-access-token');
    expect(mockedCookiesSet).toHaveBeenCalledWith('refresh_token', 'new-refresh-token');
    expect(result).toBe('new-access-token');
  });

  it('limpia las cookies y devuelve null si el refresh falla (sesión vencida de verdad)', async () => {
    mockedCookiesGet.mockReturnValue('refresh-token-vencido');
    mockedAxios.post.mockRejectedValueOnce({
      response: { status: 401, data: { error: 'Sesión inválida o vencida.' } },
    });

    const result = await refreshAccessToken();

    expect(result).toBeNull();
    expect(mockedCookiesRemove).toHaveBeenCalledWith('token');
    expect(mockedCookiesRemove).toHaveBeenCalledWith('refresh_token');
  });

  it('comparte un único pedido en curso entre llamadas concurrentes', async () => {
    mockedCookiesGet.mockReturnValue('refresh-token-abc');
    let resolvePost: (value: unknown) => void;
    mockedAxios.post.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePost = resolve;
      })
    );

    const call1 = refreshAccessToken();
    const call2 = refreshAccessToken();

    resolvePost!({
      data: {
        session: { access_token: 'shared-token', refresh_token: 'shared-refresh' },
      },
    });

    const [result1, result2] = await Promise.all([call1, call2]);

    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(result1).toBe('shared-token');
    expect(result2).toBe('shared-token');
  });
});
