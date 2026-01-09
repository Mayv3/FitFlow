import {
  getAllAsistencias,
  createAsistencia,
  getAsistenciaById,
  deleteAsistencia
} from '../services/asistencias.supabase.js'
import { supabaseAdmin } from '../db/supabaseClient.js'

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
    const { asistencia, summary } = await createAsistencia(req.supa, req.body, req.gymId)

    req.app.get('io')?.to(`gym:${req.gymId}`)?.emit('attendance:created', { id: asistencia.id })

    return res.status(201).json({
      message: 'Asistencia registrada',
      asistencia,
      summary,
    })
  } catch (error) {
    return res.status(400).json({ error: error.message })
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

export const getAsistenciasByGym = async (req, res) => {
  const { gym_id } = req.params;
  const { fecha } = req.query;

  // si no viene fecha → hoy
  const fechaFiltro =
    fecha ?? new Date().toISOString().slice(0, 10);

  try {
    const { data, error, count } = await supabaseAdmin
      .from('asistencias')
      .select('id', { count: 'exact', head: true })
      .eq('gym_id', gym_id)
      .eq('fecha', fechaFiltro);

    if (error) throw error;

    res.json({
      gym_id,
      fecha: fechaFiltro,
      total: count ?? 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAsistenciasByHora = async (req, res) => {
  const { gym_id } = req.params;
  const { fecha } = req.query;

  const fechaFiltro =
    fecha ?? new Date().toISOString().slice(0, 10);

  try {
    const { data, error } = await supabaseAdmin.rpc(
      'asistencias_hoy_por_hora',
      {
        gym_id_param: gym_id,
        fecha_param: fechaFiltro,
      }
    );

    if (error) throw error;

    const total =
      data?.reduce((acc, item) => acc + (item.total || 0), 0) ?? 0;

    res.json({
      gym_id,
      fecha: fechaFiltro,
      items: data,
      total,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


