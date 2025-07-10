import { useState, useCallback } from "react"
import { Member } from "@/models/dashboard"

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([])

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumnos`
      )
      const data: Member[] = await res.json()
      setMembers(data)
    } catch (err) {
      console.error("Error al cargar los alumnos", err)
    }
  }, [])

  const updateAttendance = useCallback((dni: string, nuevasClases: number) => {
    setMembers(prev =>
      prev.map(m =>
        m.DNI === dni ? { ...m, Clases_realizadas: nuevasClases } : m
      )
    )
  }, [])

  const updateExpiration = useCallback(
    (
      dni: string,
      Fecha_vencimiento: string,
      Plan: string,
      Clases_pagadas: number
    ) => {
      setMembers(prev =>
        prev.map(m =>
          m.DNI === dni
            ? { ...m, Fecha_vencimiento, Plan, Clases_pagadas, Clases_realizadas: 0 }
            : m
        )
      )
    },
    []
  )

  return {
    members,
    fetchMembers,
    updateAttendance,
    updateExpiration,
    setMembers,
  }
}
