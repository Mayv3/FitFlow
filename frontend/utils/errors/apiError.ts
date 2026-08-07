import { AxiosError } from 'axios';

type ApiErrorBody = { error?: string; message?: string };

/**
 * Mensaje que devolvio la API en `response.data.error`. Devuelve `undefined`
 * cuando no hubo respuesta o no trae ese campo, para que el callsite elija su
 * propio fallback (`getApiErrorMessage(e) || 'No se pudo guardar'`).
 */
export function getApiErrorMessage(error: unknown): string | undefined {
  return (error as AxiosError<ApiErrorBody>)?.response?.data?.error;
}

/** Status HTTP del error, para distinguir casos como el 403 de sesion vencida. */
export function getApiErrorStatus(error: unknown): number | undefined {
  return (error as AxiosError<ApiErrorBody>)?.response?.status;
}

/**
 * Mensaje del `Error` nativo. Para catches que no hablan con la API (o donde
 * el mensaje util lo pone el propio throw, no `response.data.error`).
 */
export function getErrorMessage(error: unknown): string | undefined {
  return error instanceof Error ? error.message : undefined;
}

/**
 * Cuerpo crudo del error para logs. Si no hubo respuesta HTTP cae al mensaje
 * del Error, replicando el viejo `err.response?.data || err.message`.
 */
export function getApiErrorDetail(error: unknown): unknown {
  const axiosError = error as AxiosError<ApiErrorBody>;
  return axiosError?.response?.data ?? (error instanceof Error ? error.message : error);
}
