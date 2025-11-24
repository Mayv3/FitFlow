import express from 'express';
import {
  handleListClases,
  handleGetClase,
  handleAddClase,
  handleEditClase,
  handleRemoveClase,
  handleListClasesSimple,
} from '../controllers/clases.controller.js';

const router = express.Router();

router.get('/', handleListClases);

// Listado simple (sin paginación)
router.get('/simple', handleListClasesSimple);

// Obtener una clase por ID
router.get('/:id', handleGetClase);

// Crear una nueva clase
router.post('/', handleAddClase);

// Editar una clase
router.put('/:id', handleEditClase);

// Eliminar una clase
router.delete('/:id', handleRemoveClase);

export default router;
