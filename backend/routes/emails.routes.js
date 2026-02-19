import express from 'express'
import { 
  enviarEmailsPorVencer, 
  enviarPruebaPlantillas,
  previewVencimientoGymPlans,
  enviarEmailsVencimientoGymPlans,
  enviarTestVencimientoGymPlan
} from '../emails/mailing.brevo.fitnessflow.js'

const router = express.Router()

/**
 * POST /api/emails/preview-vencimientos
 * Modo prueba - muestra en consola quiénes recibirían los emails sin enviar nada
 * Body (opcional): { gymIds: ['gym-id-1', 'gym-id-2'] }
 */
router.post('/preview-vencimientos', async (req, res) => {
  try {
    console.log('🔍 Iniciando preview de vencimientos...')
    const gymIds = (req.body && req.body.gymIds) ? req.body.gymIds : []
    const resultado = await enviarEmailsPorVencer({ previewOnly: true, gymIds })
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
    const gymIds = (req.body && req.body.gymIds) ? req.body.gymIds : []
    await enviarEmailsPorVencer({ previewOnly: false, gymIds })
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

// ===================================================================
//  VENCIMIENTO DE PLANES DE GIMNASIOS (Suscripciones a FitnessFlow)
// ===================================================================

/**
 * GET /api/emails/preview-vencimiento-gym-plans
 * Preview: muestra qué gimnasios tienen el plan vencido o por vencer,
 * con todos sus datos, sin enviar ningún mail.
 */
router.get('/preview-vencimiento-gym-plans', async (req, res) => {
  try {
    console.log('🔍 Iniciando preview de vencimiento de gym plans...')
    const resultado = await previewVencimientoGymPlans()
    res.json({
      success: true,
      message: 'Preview de vencimiento de planes de gimnasios.',
      data: resultado
    })
  } catch (error) {
    console.error('❌ Error en preview gym plans:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/emails/enviar-vencimiento-gym-plans
 * Envía los mails reales de vencimiento al administrador con los datos
 * de cada gimnasio cuyo plan venció o está por vencer.
 * CUIDADO: Esto realmente envía correos.
 */
router.post('/enviar-vencimiento-gym-plans', async (req, res) => {
  try {
    console.log('📧 Iniciando envío de vencimiento de gym plans...')
    const resultado = await enviarEmailsVencimientoGymPlans()
    res.json({
      success: true,
      message: 'Emails de vencimiento de planes enviados al administrador.',
      data: resultado
    })
  } catch (error) {
    console.error('❌ Error al enviar vencimiento gym plans:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/emails/test-vencimiento-gym-plan
 * Envía un mail de prueba a nicopereyra855@gmail.com para ver cómo
 * se vería el mail de vencimiento que recibe el administrador.
 */
router.post('/test-vencimiento-gym-plan', async (req, res) => {
  try {
    console.log('🧪 Enviando test de vencimiento de gym plan...')
    const resultado = await enviarTestVencimientoGymPlan()
    res.json({
      success: true,
      message: 'Email de prueba enviado a nicopereyra855@gmail.com',
      data: resultado
    })
  } catch (error) {
    console.error('❌ Error al enviar test gym plan:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
