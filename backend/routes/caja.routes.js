import { Router } from 'express'
import {
  listCajas,
  abrirCaja,
  cerrarCaja,
  removeCaja
} from '../controllers/caja.controller.js'

const router = Router()

router.get('/', listCajas)
router.delete('/:id', removeCaja)
router.post('/open', abrirCaja)
router.patch('/close/:id', cerrarCaja)

export default router
