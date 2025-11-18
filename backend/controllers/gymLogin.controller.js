import { loginByDniAndGym, getAlumnoCompleteInfo } from '../services/gymLogin.supabase.js';

export const gymLoginController = async (req, res) => {
  try {
    const { dni, gym_id } = req.body;

    if (!dni || !gym_id) {
      return res.status(400).json({ error: 'DNI y gym_id son requeridos' });
    }

    const alumno = await loginByDniAndGym(dni, gym_id);
    
    res.json(alumno);
  } catch (error) {
    console.error('[gymLoginController] Error:', error);
    res.status(404).json({ error: error.message || 'Error en el login' });
  }
};

export const getAlumnoInfoController = async (req, res) => {
  try {
    const { dni, gym_id } = req.params;

    if (!dni || !gym_id) {
      return res.status(400).json({ error: 'DNI y gym_id son requeridos' });
    }

    const alumnoInfo = await getAlumnoCompleteInfo(dni, gym_id);
    
    res.json(alumnoInfo);
  } catch (error) {
    console.error('[getAlumnoInfoController] Error:', error);
    res.status(404).json({ error: error.message || 'Error obteniendo información del alumno' });
  }
};
