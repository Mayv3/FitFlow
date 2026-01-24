import express from 'express'
import { verifyToken } from '../middleware/auth.js'
import { supaPerRequest } from '../middleware/supaPerRequest.js'
import {
  getNovedades,
  getNovedadById,
  createNovedad,
  updateNovedad,
  deleteNovedad,
  toggleActivoNovedad,
  updateOrdenNovedad,
  getNovedadesActivas
} from '../controllers/novedades.controller.js'
import { upload } from '../middleware/uploadImage.js';
import { uploadNovedadImage } from '../controllers/novedades.controller.js';

const router = express.Router()

router.use(verifyToken)
router.use(supaPerRequest)

// Rutas estáticas primero (antes de las rutas con :id)
router.get('/', getNovedades)
router.get('/activas', getNovedadesActivas)
router.post('/', createNovedad)
router.post('/upload-image', upload.single('image'), uploadNovedadImage);

// Rutas con parámetros dinámicos después
router.get('/:id', getNovedadById)
router.put('/:id', updateNovedad)
router.delete('/:id', deleteNovedad)
router.patch('/:id/activo', toggleActivoNovedad)
router.patch('/:id/orden', updateOrdenNovedad)

export default router