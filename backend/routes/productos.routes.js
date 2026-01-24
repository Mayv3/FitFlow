import express from 'express'
import { verifyToken } from '../middleware/auth.js'
import { supaPerRequest } from '../middleware/supaPerRequest.js'
import {
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
  updateStockProducto
} from '../controllers/productos.controller.js'

const router = express.Router()

// Middleware para todas las rutas
router.use(verifyToken)
router.use(supaPerRequest)

// Rutas CRUD
router.get('/', getProductos)
router.get('/:id', getProductoById)
router.post('/', createProducto)
router.put('/:id', updateProducto)
router.delete('/:id', deleteProducto)

// Ruta especial para actualizar stock
router.patch('/:id/stock', updateStockProducto)

export default router
