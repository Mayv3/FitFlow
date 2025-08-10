import { supabaseAdmin } from '../db/supabaseClient.js'
import {
  getAlumnoByDNI,
  createAlumno,
  updateAlumno,
  deleteAlumno,
  getAlumnosService
} from '../services/alumnos.supabase.js'

export async function handleListAlumnosByGym(req, res) {
  try {
    const gymId = String(req.query.gym_id ?? '');
    const page  = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const q     = String(req.query.q ?? '');

    if (!gymId) return res.status(400).json({ message: 'gym_id requerido' });

    const result = await getAlumnosService({ gymId, page, limit, q });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message ?? 'Error obteniendo alumnos' });
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
    console.log(req.body)
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

export async function getAlumnosByParams(req, res) {
  try {
    const gymId = String(req.query.gym_id ?? '');
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const q = String(req.query.q ?? '');

    if (!gymId) return res.status(400).json({ message: 'gym_id requerido' });

    const result = await getAlumnosService({ gymId, page, limit, q });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message ?? 'Error obteniendo alumnos' });
  }
}