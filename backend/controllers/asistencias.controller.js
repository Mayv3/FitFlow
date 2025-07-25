import {
  getAllAsistencias,
  createAsistencia,
  getAsistenciaById,
  deleteAsistencia
} from '../services/asistencias.supabase.js'

export const listAsistencias = async (req, res) => {
  try {
    const asistencias = await getAllAsistencias(req.gymId)
    res.json({
      message: `Asistencias encontradas: ${asistencias.length}`,
      asistencias
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const addAsistencia = async (req, res) => {
  try {
    const nueva = await createAsistencia(req.body, req.gymId)
    res.status(201).json({
      message: 'Asistencia registrada',
      asistencia: nueva
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

export const getAsistencia = async (req, res) => {
  try {
    const asi = await getAsistenciaById(req.params.id, req.gymId)
    res.json(asi)
  } catch (error) {
    res.status(404).json({ error: error.message })
  }
}

export const removeAsistencia = async (req, res) => {
  try {
    await deleteAsistencia(req.params.id, req.gymId)
    res.sendStatus(204)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
