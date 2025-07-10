import {
  getDeudasFromSheet,
  appendDeudaToSheet,
  updateDeudaByID,
  deleteDeudaByID,
} from "../services/googleSheets.js"
import dayjs from "dayjs"

export const getDeudas = async (req, res) => {
  try {
    const deudas = await getDeudasFromSheet()
    res.json(deudas)
  } catch (error) {
    console.error("Error al obtener deudas:", error)
    res.status(500).json({ message: "Error al obtener deudas" })
  }
}

export const createDeuda = async (req, res) => {
  try {
    const { dni, nombre, tipo, monto, motivo, responsable } = req.body

    if (!dni || !nombre || !tipo || !monto || !motivo) {
      return res.status(400).json({ message: "Faltan campos obligatorios" })
    }

    const nuevaDeuda = {
      DNI: dni,
      Nombre: nombre,
      Tipo: tipo,
      Monto: monto,
      Motivo: motivo,
      Fecha: dayjs().format("DD/MM/YYYY"),
      Estado: "No pagado",
      Responsable: responsable,
    }

    const deudaCreada = await appendDeudaToSheet(nuevaDeuda)
    res.status(201).json(deudaCreada)
  } catch (error) {
    console.error("Error al crear deuda:", error)
    res.status(500).json({ message: "Error al crear deuda" })
  }
}

export const updateDeuda = async (req, res) => {
  try {
    const { id } = req.params
    const actualizada = await updateDeudaByID(id, req.body)
    if (!actualizada) return res.status(404).json({ message: "No encontrada" })

    const deudas = await getDeudasFromSheet()
    const deuda = deudas.find((d) => d.ID === id)
    res.json(deuda)
  } catch (error) {
    console.error("Error al actualizar deuda:", error)
    res.status(500).json({ message: "Error al actualizar deuda" })
  }
}

export const deleteDeuda = async (req, res) => {
  try {
    const { id } = req.params
    const eliminado = await deleteDeudaByID(id)
    if (!eliminado) return res.status(404).json({ message: "No encontrada" })
    res.json({ message: "Deuda eliminada correctamente" })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Error al eliminar deuda", error: error })
  }
}

export const getDeudaAlumno = async (req, res) => {
  try {
    const { dni } = req.params
    if (!dni) return res.status(400).json({ message: "DNI requerido" })

    const deudas = await getDeudasFromSheet()

    const deudasAlumno = deudas.filter(
      (d) => d.DNI === dni && d.Estado === "No pagado"
    )

    const montoTotal = deudasAlumno.reduce(
      (sum, d) => sum + Number(d.Monto || 0),
      0
    )

    res.json({
      tieneDeuda: deudasAlumno.length > 0,
      monto: montoTotal,
      cantidad: deudasAlumno.length,
      detalle: deudasAlumno,
    })
  } catch (error) {
    console.error("Error al consultar deuda del alumno:", error)
    res.status(500).json({ message: "Error al consultar deuda del alumno" })
  }
}

export const getDeudasPorMes = async (req, res) => {
  try {
    const { mes, anio } = req.query
    if (!mes || !anio) {
      return res.status(400).json({ message: "Mes y año requeridos" })
    }

    const deudas = await getDeudasFromSheet()

    const deudasFiltradas = deudas.filter((deuda) => {
      const fecha = dayjs(deuda.Fecha, "DD/MM/YYYY", true)
      return fecha.isValid() &&
        fecha.month() + 1 === parseInt(mes) &&
        fecha.year() === parseInt(anio)
    })

    res.json(deudasFiltradas)
  } catch (error) {
    console.error("Error al filtrar deudas por mes:", error)
    res.status(500).json({ message: "Error al filtrar deudas por mes" })
  }
}