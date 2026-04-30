import express from 'express';
import {
  handleGetSesionesByClase,
  handleAddSesion,
  handleEditSesion,
  handleRemoveSesion,
  handleInscribirAlumno,
  handleDesinscribirAlumno,
  handleToggleEsFija,
  handleGetInscripcionesByAlumno,
} from '../controllers/sesiones.controller.js';
import { verifyToken } from '../middleware/auth.js';
import { supaPerRequest } from '../middleware/supaPerRequest.js';

const router = express.Router();
router.use(verifyToken, supaPerRequest);

// Sesiones de una clase
router.get('/clase/:claseId', handleGetSesionesByClase);
router.post('/', handleAddSesion);
router.put('/:id', handleEditSesion);
router.delete('/:id', handleRemoveSesion);

// Inscripciones
router.post('/inscribir', handleInscribirAlumno);
router.post('/desinscribir', handleDesinscribirAlumno);
router.patch('/toggle-fija', handleToggleEsFija);
router.get('/alumno/:alumnoId', handleGetInscripcionesByAlumno);

export default router;
