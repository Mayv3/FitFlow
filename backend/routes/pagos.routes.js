import { Router } from 'express'
import {
  listPagos,
  getPago,
  addPago,
  editPago,
  removePago
} from '../controllers/pagos.controller.js'

const router = Router()
router.get('/', listPagos)
router.get('/:id', getPago)
router.post('/', addPago)
router.put('/:id', editPago)
router.delete('/:id', removePago)

export default router
