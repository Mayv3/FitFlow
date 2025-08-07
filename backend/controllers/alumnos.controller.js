import { supabaseAdmin } from '../db/supabaseClient.js'
import {
  getAlumnoByDNI,
  createAlumno,
  updateAlumno,
  deleteAlumno
} from '../services/alumnos.supabase.js'

export async function handleListAlumnosByGym(req, res) {
  const gymId = req.user.user_metadata.gym_id;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabaseAdmin
    .from('alumnos')
    .select('*', { count: 'exact' })
    .eq('gym_id', gymId)
    .order('id', { ascending: false })
    .range(from, to);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({
    items: data,
    total: count,
    page,
    limit,
  });
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
