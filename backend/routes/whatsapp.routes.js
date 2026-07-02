import express from 'express'
import { verifyToken } from '../middleware/auth.js'
import { requireRole } from '../middleware/requireRole.js'
import {
  postConnect,
  getStatus,
  getQr,
  postDisconnect,
  postTest,
  postSimulate,
  postTriggerGym,
  postTriggerAll,
  getDryRunAll,
  getMensajes,
  getMensajesCalendar,
  getOwnerMensajes,
  patchConfig,
  getConfig
} from '../controllers/whatsapp.controller.js'

const router = express.Router()

// Cron público con header secret
router.post('/trigger-all', postTriggerAll)
router.get('/dry-run-all', verifyToken, requireRole(1), getDryRunAll)

// Owner: mensajes de WhatsApp de todos los gimnasios (rol OWNER = 1)
router.get('/owner/mensajes', verifyToken, requireRole(1), getOwnerMensajes)

// Operaciones por gym (auth requerida)
router.post('/gyms/:gymId/connect', verifyToken, postConnect)
router.get('/gyms/:gymId/status', verifyToken, getStatus)
router.get('/gyms/:gymId/qr', verifyToken, getQr)
router.post('/gyms/:gymId/disconnect', verifyToken, postDisconnect)
router.post('/gyms/:gymId/test', verifyToken, postTest)
router.post('/gyms/:gymId/simulate', verifyToken, postSimulate)
router.post('/gyms/:gymId/trigger', verifyToken, postTriggerGym)
router.get('/gyms/:gymId/mensajes', verifyToken, getMensajes)
router.get('/gyms/:gymId/mensajes/calendar', verifyToken, getMensajesCalendar)
router.get('/gyms/:gymId/config', verifyToken, getConfig)
router.patch('/gyms/:gymId/config', verifyToken, patchConfig)

export default router
