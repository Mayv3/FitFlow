import {
  getAllAlumnos,
  getAlumnoByDNI,
  createAlumno,
  updateAlumno,
  deleteAlumno
} from '../services/alumnos.supabase.js'

import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter.js'
dayjs.extend(isSameOrAfter)


export const listAlumnos = async (_req, res) => {
  try {
    const alumnos = await getAllAlumnos()
    res.json(alumnos)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getAlumno = async (req, res) => {
  try {
    const alumno = await getAlumnoByDNI(req.params.dni)
    res.json(alumno)
  } catch (error) {
    res.status(404).json({ error: error.message })
  }
}

export const addAlumno = async (req, res) => {
  try {
    const nuevo = await createAlumno(req.body)
    res.status(201).json(nuevo)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

export const editAlumno = async (req, res) => {
  try {
    const actualizado = await updateAlumno(req.params.dni, req.body)
    res.json(actualizado)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

export const removeAlumno = async (req, res) => {
  try {
    await deleteAlumno(req.params.dni)
    res.sendStatus(204)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
