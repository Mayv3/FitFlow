import express from 'express';
import {
  handleGetSesionesByClase,
  handleAddSesion,
  handleEditSesion,
  handleRemoveSesion,
  handleInscribirAlumno,
  handleDesinscribirAlumno,
  handleGetInscripcionesByAlumno,
} from '../controllers/sesiones.controller.js';

const router = express.Router();

// Sesiones de una clase
router.get('/clase/:claseId', handleGetSesionesByClase);
router.post('/', handleAddSesion);
router.put('/:id', handleEditSesion);
router.delete('/:id', handleRemoveSesion);

// Inscripciones
router.post('/inscribir', handleInscribirAlumno);
router.post('/desinscribir', handleDesinscribirAlumno);
router.get('/alumno/:alumnoId', handleGetInscripcionesByAlumno);

export default router;
