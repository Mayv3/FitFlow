import express from 'express'
import { enviarEmailsPorVencer, enviarPruebaPlantillas } from '../emails/mailing.brevo.fitnessflow.js'

const router = express.Router()

/**
 * POST /api/emails/preview-vencimientos
 * Modo prueba - muestra en consola quiénes recibirían los emails sin enviar nada
 * Body (opcional): { gymIds: ['gym-id-1', 'gym-id-2'] }
 */
router.post('/preview-vencimientos', async (req, res) => {
  try {
    console.log('🔍 Iniciando preview de vencimientos...')
    const resultado = await enviarEmailsPorVencer({ previewOnly: true, gymIds: req.body.gymIds || [] })
    res.json({ 
      success: true, 
      message: 'Preview completado. Revisa los detalles a continuación.',
      data: resultado
    })
  } catch (error) {
    console.error('❌ Error en preview:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/emails/enviar-vencimientos
 * Envía emails reales a todos los alumnos con planes vencidos
 * Body (opcional): { gymIds: ['gym-id-1', 'gym-id-2'] }
 * CUIDADO: Esto realmente envía correos
 */
router.post('/enviar-vencimientos', async (req, res) => {
  try {
    console.log('📧 Iniciando envío de vencimientos...')
    await enviarEmailsPorVencer({ previewOnly: false, gymIds: req.body.gymIds || [] })
    res.json({ 
      success: true, 
      message: 'Emails enviados correctamente'
    })
  } catch (error) {
    console.error('❌ Error al enviar vencimientos:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/emails/prueba-plantillas
 * Envía las dos plantillas de prueba a tu email personal (nicopereyra@gmail.com)
 * Útil para verificar que las plantillas HTML se ven correctas
 */
router.post('/prueba-plantillas', async (req, res) => {
  try {
    console.log('🎨 Enviando plantillas de prueba...')
    await enviarPruebaPlantillas()
    res.json({ 
      success: true, 
      message: 'Plantillas de prueba enviadas a tu email personal'
    })
  } catch (error) {
    console.error('❌ Error al enviar plantillas de prueba:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
