import fetch from 'node-fetch'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
dayjs.extend(utc)
dayjs.extend(timezone)

dotenv.config()

const BREVO_API_KEY = process.env.BREVO_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL || 'notificaciones@fitnessflow.app'
const BRAND_NAME = process.env.BRAND_NAME || 'Fitness Flow'
const BRAND_LOGO_URL = 'https://www.fitnessflow.com.ar/images/icon.png'

if (!BREVO_API_KEY) console.error('❌ FALTA BREVO_API_KEY')
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ FALTA SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

function isValidEmail(email = '') {
  const e = String(email).trim().toLowerCase()
  return e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
}

async function sendBrevoEmail({ to, subject, text, html }) {
  if (!isValidEmail(to)) return console.log(`⚠️ Email inválido: ${to}`)

  const payload = {
    sender: { email: FROM_EMAIL, name: BRAND_NAME },
    to: [{ email: to }],
    subject,
    htmlContent: html,
    textContent: text,
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': BREVO_API_KEY,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Brevo API error: ${res.status} - ${err}`)
  }

  console.log(`📧 Enviado a ${to}`)
}

function plantillaVenceHoy(nombre) {
  return `
  <div style="background:#f4f6f8;padding:30px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:600px;margin:auto;background:white;border-radius:14px;overflow:hidden;box-shadow:0 3px 12px rgba(0,0,0,0.08);text-align:center;">
      <div style="background:linear-gradient(135deg,#00c88f,#0fd976);padding:30px 20px;">
        <h1 style="color:white;margin:0;font-size:24px;font-weight:bold;">¡Tu plan vence hoy!</h1>
      </div>
      <div style="padding:25px;color:#333;">
        <p>Hola <strong>${nombre || 'atleta'}</strong> 👋,</p>
        <p>Hoy vence tu plan de entrenamiento. No dejes que se corte tu progreso 💪</p>
        <p>Renová tu plan desde tu cuenta para seguir entrenando sin interrupciones.</p>
      </div>
      <div style="background:#f4f6f8;padding:15px;text-align:center;font-size:12px;color:#777;">
        Enviado automáticamente por <strong>${BRAND_NAME}</strong>
      </div>
    </div>
  </div>
  `
}

function plantillaVenceEnTres(nombre) {
  return `
  <div style="background:#f4f6f8;padding:30px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:600px;margin:auto;background:white;border-radius:14px;overflow:hidden;box-shadow:0 3px 12px rgba(0,0,0,0.08);text-align:center;">
      <div style="background:linear-gradient(135deg,#00c88f,#0fd976);padding:30px 20px;">
        <h1 style="color:white;margin:0;font-size:24px;font-weight:bold;">Tu plan vence en 3 días</h1>
      </div>
      <div style="padding:25px;color:#333;">
        <p>Hola <strong>${nombre || 'atleta'}</strong> 👋,</p>
        <p>Tu plan de entrenamiento vence en 3 días.</p>
        <p>Te recomendamos renovarlo con anticipación para mantener la constancia y aprovechar al máximo tus resultados.</p>
      </div>
      <div style="background:#f4f6f8;padding:15px;text-align:center;font-size:12px;color:#777;">
        Enviado automáticamente por <strong>${BRAND_NAME}</strong>
      </div>
    </div>
  </div>
  `
}



const delay = (ms) => new Promise(res => setTimeout(res, ms))

export async function enviarEmailsPorVencer({ previewOnly = true, gymIds = [] } = {}) {
  const ZONE = 'America/Argentina/Cordoba'
  const hoy = dayjs.tz(dayjs(), ZONE).startOf('day')
  const hoyStr = hoy.format('YYYY-MM-DD')
  const tresDiasStr = hoy.add(3, 'day').format('YYYY-MM-DD')

  console.log(`📅 Buscando alumnos con vencimiento HOY (${hoyStr}) o en 3 días (${tresDiasStr})...`)

  let query = supabase
    .from('alumnos')
    .select('id,nombre,email,fecha_de_vencimiento,gym_id')
    .is('deleted_at', null)
    .in('fecha_de_vencimiento', [hoyStr, tresDiasStr])

  if (gymIds?.length) query = query.in('gym_id', gymIds)
  const { data, error } = await query
  if (error) throw error

  if (!data?.length) {
    console.log('📭 No hay alumnos para enviar recordatorios.')
    return
  }

  if (previewOnly) {
    console.table(data.map(a => ({
      Nombre: a.nombre,
      Email: a.email,
      Vencimiento: a.fecha_de_vencimiento,
    })))
    console.log('⚠️ Modo preview: no se enviaron correos.')
    return
  }

  for (const alumno of data) {
    const { email, nombre, fecha_de_vencimiento } = alumno
    const venceHoy = fecha_de_vencimiento === hoyStr
    const subject = venceHoy ? '📅 ¡Tu plan vence hoy!' : '⚠️ Tu plan vence en 3 días'
    const html = venceHoy ? plantillaVenceHoy(nombre) : plantillaVenceEnTres(nombre)
    const text = `${subject}\n\nRenová tu plan en https://fitnessflow.com.ar\n\n— ${BRAND_NAME}`

    await sendBrevoEmail({ to: email, subject, text, html })
    await delay(1000)
  }

  console.log('✅ Correos enviados correctamente.')
}

export async function enviarPruebaPlantillas() {
  const to = 'nicopereyra@gmail.com'
  const nombre = 'Nico'
  const subjectHoy = '📅 ¡Tu plan vence hoy!'
  const subjectTres = '⚠️ Tu plan vence en 3 días'

  console.log('🚀 Enviando prueba de las dos plantillas a tu email personal...')

  const htmlHoy = plantillaVenceHoy(nombre)
  const textHoy = `${subjectHoy}\n\nPrueba de visualización de la plantilla de vencimiento HOY.\n\n— ${BRAND_NAME}`
  await sendBrevoEmail({ to, subject: subjectHoy, text: textHoy, html: htmlHoy })

  const htmlTres = plantillaVenceEnTres(nombre)
  const textTres = `${subjectTres}\n\nPrueba de visualización de la plantilla de vencimiento en 3 días.\n\n— ${BRAND_NAME}`
  await sendBrevoEmail({ to, subject: subjectTres, text: textTres, html: htmlTres })

  console.log('✅ Correos de prueba enviados a tu cuenta personal.')
}