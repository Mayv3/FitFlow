'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Sesion, Inscripcion } from '@/models/Sesion/Sesion'

const sesionesKey = (claseId: number) => ['sesiones', claseId] as const

// Obtener sesiones de una clase
export const useSesionesByClase = (claseId?: number) => {
  return useQuery({
    queryKey: sesionesKey(claseId!),
    enabled: !!claseId,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<Sesion[]> => {
      const { data } = await api.get(
        `/api/sesiones/clase/${claseId}`
      )
      return data
    },
  })
}

// Crear sesión
export const useAddSesion = (claseId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: any) => {
      const { data } = await api.post(
        `/api/sesiones`,
        { ...values, clase_id: claseId }
      )
      return data as Sesion
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sesionesKey(claseId) })
    },
  })
}

// Editar sesión
export const useEditSesion = (claseId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: number; values: any }) => {
      const { data } = await api.put(
        `/api/sesiones/${id}`,
        values
      )
      return data as Sesion
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sesionesKey(claseId) })
    },
  })
}

// Eliminar sesión
export const useDeleteSesion = (claseId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, gym_id }: { id: number; gym_id: string }) => {
      await api.delete(
        `/api/sesiones/${id}`,
        { params: { gym_id } }
      )
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sesionesKey(claseId) })
    },
  })
}

// Inscribir alumno
export const useInscribirAlumno = (claseId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: { sesion_id: number; alumno_id: number; gym_id: string }) => {
      const { data } = await api.post(
        `/api/sesiones/inscribir`,
        values
      )
      return data as Inscripcion
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sesionesKey(claseId) })
    },
  })
}

// Desinscribir alumno
export const useDesinscribirAlumno = (claseId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: { sesion_id: number; alumno_id: number; gym_id: string }) => {
      await api.post(
        `/api/sesiones/desinscribir`,
        values
      )
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sesionesKey(claseId) })
    },
  })
}

// Toggle fija/temporal de una inscripción
export const useToggleEsFija = (claseId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: { sesion_id: number; alumno_id: number; es_fija: boolean; gym_id: string }) => {
      const { data } = await api.patch(
        `/api/sesiones/toggle-fija`,
        values
      )
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sesionesKey(claseId) })
    },
  })
}

// Obtener inscripciones de un alumno
export const useInscripcionesByAlumno = (alumnoId?: number) => {
  return useQuery({
    queryKey: ['inscripciones', alumnoId],
    enabled: !!alumnoId,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data } = await api.get(
        `/api/sesiones/alumno/${alumnoId}`
      )
      return data
    },
  })
}
