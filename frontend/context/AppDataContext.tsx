"use client"
import React, { createContext, useContext, useEffect, useState } from "react"
import dayjs from "dayjs"
import { usePathname } from "next/navigation";

interface Plan {
  ID: string
  Tipo: string
  Precio: string
  ["Plan o Producto"]: string
  numero_Clases: number
  Coins: string
}
interface Alumno {
  ID: string
  DNI: string
  Nombre: string
  Email: string
  Telefono: string
  Sexo: string
  Fecha_nacimiento: string
  Plan: string
  Clases_pagadas: string
  Clases_realizadas: string
  Fecha_inicio: string
  Fecha_vencimiento: string
  Profesor_asignado: string
  GymCoins: string
}
interface Asistencia {
  ID: string
  Fecha: string
  ["Tipo de Clase"]: string
  ["Cantidad de presentes"]: string
  Responsable: string
}
interface Turno {
  ID: string
  Tipo: string
  Fecha_turno: string
  Profesional: string
  Hora: string
  Responsable: string
}

interface AppDataContextProps {
  planes: Plan[]
  assists: Asistencia[]
  turnos: Turno[]
  egresos: any[]
  setEgresos: React.Dispatch<React.SetStateAction<any[]>>
  fetchPlanes: () => Promise<void>
  fetchAssists: (options: { selectedDate: Date; selectedType: string }) => Promise<void>
  setAssists: React.Dispatch<React.SetStateAction<Asistencia[]>>
  deleteAsistencia: (id: string) => Promise<void>
  editAsistencia: (id: string, nuevosDatos: Partial<Asistencia>) => Promise<void>
  alumnos: Alumno[]
  fetchAlumnos: () => Promise<void>
  setAlumnos: React.Dispatch<React.SetStateAction<Alumno[]>>
  setPlanes: React.Dispatch<React.SetStateAction<Plan[]>>
  setTurnos: React.Dispatch<React.SetStateAction<Turno[]>>
  fetchTurnos: (selectedDate?: Date) => Promise<void>
}

const AppDataContext = createContext<AppDataContextProps>({
  planes: [],
  assists: [],
  alumnos: [],
  turnos: [],
  egresos: [],
  fetchPlanes: async () => { },
  fetchAssists: async () => { },
  fetchAlumnos: async () => { },
  fetchTurnos: async () => { },
  setPlanes: () => { },
  setAssists: () => { },
  setAlumnos: () => { },
  setTurnos: () => { },
  setEgresos: () => { },
  deleteAsistencia: async () => { },
  editAsistencia: async () => { },
})

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [planes, setPlanes] = useState<Plan[]>([])
  const [assists, setAssists] = useState<Asistencia[]>([])
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [egresos, setEgresos] = useState<any[]>([])

  const pathname = usePathname();
  const esLogin = pathname === "/login";
  const esAdmin = pathname === "/dashboard/administrator"
  const esUser = pathname === "/dashboard/member"

  const fetchAlumnos = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumnos`)
      const data = await res.json()
      setAlumnos(data)
    } catch (error) {
      console.error("Error al obtener alumnos:", error)
    }
  }

  const fetchPlanes = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/planes`)
      const data = await res.json()
      setPlanes(data)
    } catch (error) {
      console.error("Error al cargar los planes", error)
    }
  }

  const fetchAssists = async ({ selectedDate, selectedType }: { selectedDate: Date; selectedType: string }) => {
    try {

      const fechaFormateada = selectedDate ? dayjs(selectedDate).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");
      const params = new URLSearchParams({ fecha: fechaFormateada })

      if (selectedType !== "todas") {
        params.append("tipo", selectedType)
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/clases-diarias?${params.toString()}`)
      const data = await res.json()

      const formateadas = data.map((asistencia: any) => ({
        ...asistencia,
        Fecha: asistencia.Fecha,
      }))

      setAssists(formateadas)
    } catch (error) {
      console.error("Error al obtener clases diarias", error)
    }
  }

  const fetchTurnos = async (selectedDate?: Date) => {
    try {
      const fechaFormateada = selectedDate ? dayjs(selectedDate).format("DD/MM/YYYY") : dayjs().format("DD/MM/YYYY");
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/turnos?fecha=${fechaFormateada}`)
      const data = await res.json()
      console.log(data)
      setTurnos(data)
    } catch (error) {
      console.error("Error al obtener turnos:", error)
    }
  }

  const deleteAsistencia = async (id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/clases-diarias/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Error al eliminar")
      }

      setAssists((prev) => prev.filter((asistencia) => asistencia.ID !== id))
    } catch (error) {
      console.error("Error al eliminar asistencia:", error)
      throw error
    }
  }

  const editAsistencia = async (id: string, nuevosDatos: Partial<Asistencia>) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/clases-diarias/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(nuevosDatos)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Error al editar asistencia")
      }

      setAssists((prev) =>
        prev.map((asistencia) =>
          asistencia.ID === id ? { ...asistencia, ...nuevosDatos } : asistencia
        )
      )
    } catch (error) {
      console.error("Error al editar asistencia:", error)
      throw error
    }
  }

  const fetchDashboardCompleto = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/dashboard/datosBase`)
    const data = await res.json()
    setAlumnos(data.alumnos)
    setPlanes(data.planes)
    setTurnos(data.turnos)
    setAssists(data.asistencias)
    setEgresos(data.egresos)
  }

  useEffect(() => {
    if (esLogin || esUser) return;
    fetchDashboardCompleto();

  }, [esLogin, esAdmin])

  return (
    <AppDataContext.Provider
      value={{
        planes,
        assists,
        alumnos,
        turnos,
        egresos,
        fetchPlanes,
        fetchAssists,
        fetchAlumnos,
        fetchTurnos,
        setPlanes,
        setAssists,
        setAlumnos,
        setTurnos,
        setEgresos,
        deleteAsistencia,
        editAsistencia
      }}
    >
      {children}
    </AppDataContext.Provider>
  )
}

export function useAppData() {
  return useContext(AppDataContext)
}
