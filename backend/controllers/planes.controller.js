import { getPlanes as getPlanesSvc } from '../services/planes.supabase.js';

export const getPlanes = async (req, res) => {
  try {
    const { gymId } = req.query; // opcional
    const planes = await getPlanesSvc({ gymId });
    res.status(200).json(planes);
  } catch (err) {
    console.error('Error obteniendo planes:', err);
    res.status(500).json({ message: 'Error al obtener los planes', detail: err.message });
  }
};