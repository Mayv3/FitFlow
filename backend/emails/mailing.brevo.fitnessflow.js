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

const EMAILS_IGNORADOS = ['123@gmail.com', '7777777@gmail.com']

// Validaciones críticas de variables de entorno
if (!BREVO_API_KEY) {
  console.error('❌ FALTA BREVO_API_KEY - No se podrán enviar emails')
  throw new Error('BREVO_API_KEY es requerida')
}
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ FALTA SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  throw new Error('Variables de Supabase son requeridas')
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
  // Validar que el email exista
  if (!to || typeof to !== 'string') {
    console.log(`⚠️ Email faltante o inválido`)
    return
  }

  // Convertir a minúscula y limpiar espacios
  const emailLower = String(to).trim().toLowerCase()
  
  if (!isValidEmail(emailLower)) {
    console.log(`⚠️ Email inválido: ${to}`)
    return
  }
  
  // Ignorar emails de prueba
  if (EMAILS_IGNORADOS.includes(emailLower)) {
    console.log(`⏭️ Email ignorado (prueba): ${emailLower}`)
    return
  }

  const payload = {
    sender: { email: FROM_EMAIL, name: BRAND_NAME },
    to: [{ email: emailLower }],
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

  console.log(`📧 Enviado a ${emailLower}`)
}

function plantillaVenceHoy(nombre, gymLogo, gymColor, gymName) {
  const colorPrincipal = gymColor || '#0dc985'
  const nombreGym = gymName || BRAND_NAME
  
  // No mostrar logo si es de ui-avatars (es un placeholder)
  const esLogoPlaceholder = gymLogo?.includes('ui-avatars.com')
  const logo = (gymLogo && !esLogoPlaceholder) ? gymLogo : null
  
  return `
  <div style="background:#f4f6f8;padding:30px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:600px;margin:auto;background:white;border-radius:14px;overflow:hidden;box-shadow:0 3px 12px rgba(0,0,0,0.08);text-align:center;">
      <div style="background:${colorPrincipal};padding:30px 20px;">
        ${logo ? `<img src="${logo}" alt="${nombreGym}" style="height:50px;width:50px;border-radius:100%;margin-bottom:15px;object-fit:cover;"/><h2 style="color:white;margin:0 0 10px 0;font-size:20px;font-weight:bold;">${nombreGym}</h2>` : `<h2 style="color:white;margin:0 0 10px 0;font-size:20px;font-weight:bold;">${nombreGym}</h2>`}
        <h1 style="color:white;margin:0;font-size:24px;font-weight:bold;">¡Tu plan vence hoy!</h1>
      </div>
      <div style="padding:25px;color:#333;">
        <p>Hola <strong>${nombre || 'atleta'}</strong> 👋,</p>
        <p>Hoy vence tu plan de entrenamiento. No dejes que se corte tu progreso 💪</p>
      </div>
      <div style="background:#f4f6f8;padding:15px;text-align:center;font-size:12px;color:#777;">
        Enviado automáticamente por <strong>${nombreGym}</strong>
      </div>
    </div>
  </div>
  `
}

function plantillaVenceEnTres(nombre, gymLogo, gymColor, gymName) {
  const colorPrincipal = gymColor || '#0dc985'
  const nombreGym = gymName || BRAND_NAME
  
  // No mostrar logo si es de ui-avatars (es un placeholder)
  const esLogoPlaceholder = gymLogo?.includes('ui-avatars.com')
  const logo = (gymLogo && !esLogoPlaceholder) ? gymLogo : null
  
  return `
  <div style="background:#f4f6f8;padding:30px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:600px;margin:auto;background:white;border-radius:14px;overflow:hidden;box-shadow:0 3px 12px rgba(0,0,0,0.08);text-align:center;">
      <div style="background:${colorPrincipal};padding:30px 20px;">
        ${logo ? `<img src="${logo}" alt="${nombreGym}" style="height:50px;width:50px;border-radius:100%;margin-bottom:15px;object-fit:cover;"/><h2 style="color:white;margin:0 0 10px 0;font-size:20px;font-weight:bold;">${nombreGym}</h2>` : `<h2 style="color:white;margin:0 0 10px 0;font-size:20px;font-weight:bold;">${nombreGym}</h2>`}
        <h1 style="color:white;margin:0;font-size:24px;font-weight:bold;">Tu plan vence en 3 días</h1>
      </div>
      <div style="padding:25px;color:#333;">
        <p>Hola <strong>${nombre || 'atleta'}</strong> 👋,</p>
        <p>Tu plan de entrenamiento vence en 3 días.</p>
        <p>Te recomendamos renovarlo con anticipación para mantener la constancia y aprovechar al máximo tus resultados.</p>
      </div>
      <div style="background:#f4f6f8;padding:15px;text-align:center;font-size:12px;color:#777;">
        Enviado automáticamente por <strong>${nombreGym}</strong>
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

  // Obtener todos los gimnasios o solo los especificados
  let gymsQuery = supabase.from('gyms').select('id,name,logo_url,settings')
  
  if (gymIds?.length) {
    gymsQuery = gymsQuery.in('id', gymIds)
  }
  
  const { data: gyms, error: gymsError } = await gymsQuery
  if (gymsError) throw gymsError

  if (!gyms || gyms.length === 0) {
    console.log('📭 No hay gimnasios disponibles.')
    return
  }

  console.log(`\n🏋️ Procesando ${gyms.length} gimnasio(s)...\n`)

  let query = supabase
    .from('alumnos')
    .select('id,nombre,email,fecha_de_vencimiento,gym_id')
    .is('deleted_at', null)
    .in('fecha_de_vencimiento', [hoyStr, tresDiasStr])

  const { data, error } = await query
  if (error) throw error

  const alumnosFiltrados = data?.filter(a => !EMAILS_IGNORADOS.includes(a.email?.toLowerCase())) || []

  if (!alumnosFiltrados.length) {
    console.log('📭 No hay alumnos para enviar recordatorios.')
    return
  }

  // Agrupar por gimnasio
  const alumnosPorGym = {}
  gyms.forEach(gym => {
    const settings = gym.settings || {}
    const colors = settings.colors || {}
    
    alumnosPorGym[gym.id] = {
      nombre: gym.name,
      logo: gym.logo_url,
      color: colors.primary || '#0dc985',
      alumnos: []
    }
  })

  alumnosFiltrados.forEach(alumno => {
    if (alumnosPorGym[alumno.gym_id]) {
      alumnosPorGym[alumno.gym_id].alumnos.push(alumno)
    }
  })

  if (previewOnly) {
    console.log('🔍 MODO PRUEBA - Alumnos que recibirán recordatorio de vencimiento:\n')
    
    let totalAlumnos = 0
    const resultado = {
      gimnasios: [],
      totalAlumnos: 0
    }
    
    Object.entries(alumnosPorGym).forEach(([gymId, gymData]) => {
      console.log(`\n💪 Gimnasio: ${gymData.nombre} (ID: ${gymId})`)
      console.log(`   Total de alumnos en este gimnasio: ${gymData.alumnos.length}`)
      
      const alumnosFormateados = gymData.alumnos.map(alumno => {
        const tipo = alumno.fecha_de_vencimiento === hoyStr ? 'HOY' : 'EN_3_DIAS'
        return {
          nombre: alumno.nombre,
          email: alumno.email,
          fechaVencimiento: alumno.fecha_de_vencimiento,
          tipo: tipo
        }
      })
      
      resultado.gimnasios.push({
        id: gymId,
        nombre: gymData.nombre,
        totalAlumnos: gymData.alumnos.length,
        alumnos: alumnosFormateados
      })
      
      if (gymData.alumnos.length > 0) {
        console.log('   ' + '─'.repeat(100))
        
        gymData.alumnos.forEach(alumno => {
          const tipo = alumno.fecha_de_vencimiento === hoyStr ? '🔴 HOY' : '🟡 EN 3 DÍAS'
          console.log(`   ${tipo} | ${alumno.nombre.padEnd(25)} | ${alumno.email.padEnd(35)} | Vence: ${alumno.fecha_de_vencimiento}`)
          totalAlumnos++
        })
      }
    })
    
    resultado.totalAlumnos = totalAlumnos
    
    console.log('\n' + '═'.repeat(120))
    console.log(`✅ TOTAL DE ALUMNOS QUE RECIBIRÁN EMAIL: ${totalAlumnos}`)
    console.log('═'.repeat(120) + '\n')
    console.log('⚠️ Modo preview: no se enviaron correos.')
    
    return resultado
  }

  for (const alumno of alumnosFiltrados) {
    const { email, nombre, fecha_de_vencimiento, gym_id } = alumno
    
    // Validar que el alumno tenga email
    if (!email) {
      console.log(`⚠️ Alumno sin email: ${nombre || 'Sin nombre'} (ID: ${alumno.id})`)
      continue
    }
    
    // Validar que tenga nombre (usar fallback si no existe)
    const nombreFinal = nombre?.trim() || 'Atleta'
    
    // Obtener datos del gimnasio
    const gymData = alumnosPorGym[gym_id] || {}
    const gymLogo = gymData.logo
    const gymColor = gymData.color
    const gymName = gymData.nombre
    
    const venceHoy = fecha_de_vencimiento === hoyStr
    const subject = venceHoy ? '📅 ¡Tu plan vence hoy!' : '⚠️ Tu plan vence en 3 días'
    const html = venceHoy 
      ? plantillaVenceHoy(nombreFinal, gymLogo, gymColor, gymName) 
      : plantillaVenceEnTres(nombreFinal, gymLogo, gymColor, gymName)
    const text = `${subject}\n\nRenová tu plan en https://fitnessflow.com.ar\n\n— ${gymName || BRAND_NAME}`

    try {
      await sendBrevoEmail({ to: email, subject, text, html })
      await delay(1000)
    } catch (error) {
      console.error(`❌ Error al enviar email a ${email}:`, error.message)
      // Continuar con el siguiente alumno en lugar de detener todo el proceso
    }
  }

  console.log('✅ Proceso de envío finalizado.')
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