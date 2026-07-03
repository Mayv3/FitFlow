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
    return
  }

  // Convertir a minúscula y limpiar espacios
  const emailLower = String(to).trim().toLowerCase()
  
  if (!isValidEmail(emailLower)) {
    return
  }
  
  // Ignorar emails de prueba
  if (EMAILS_IGNORADOS.includes(emailLower)) {
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

/**
 * Guarda un registro de email enviado/intentado para un gimnasio
 */
async function logGymEmail({
  gymId,
  emailDestino,
  asunto,
  tipo = 'vencimiento_gym_plan',
  estado = 'enviado',
  errorMsg = null,
  planNombre = null,
  planPrecio = null,
  endAt = null,
}) {
  if (!gymId) return
  try {
    const { error } = await supabase.from('gym_email_logs').insert({
      gym_id: gymId,
      email_destino: emailDestino,
      asunto,
      tipo,
      estado,
      error_msg: errorMsg,
      plan_nombre: planNombre,
      plan_precio: planPrecio,
      end_at: endAt,
    })
    if (error) console.error('⚠️ No se pudo registrar log de email:', error.message)
  } catch (e) {
    console.error('⚠️ Error registrando log de email:', e.message)
  }
}


export async function enviarEmailsPorVencer({ previewOnly = true, gymIds = [] } = {}) {
  const ZONE = 'America/Argentina/Cordoba'
  const hoy = dayjs.tz(dayjs(), ZONE).startOf('day')
  const hoyStr = hoy.format('YYYY-MM-DD')
  const tresDiasStr = hoy.add(3, 'day').format('YYYY-MM-DD')

  let gymsQuery = supabase.from('gyms').select('id,name,logo_url,settings')
  
  if (gymIds?.length) {
    gymsQuery = gymsQuery.in('id', gymIds)
  }
  
  const { data: gyms, error: gymsError } = await gymsQuery
  if (gymsError) throw gymsError

  if (!gyms || gyms.length === 0) {
    return
  }

  let query = supabase
    .from('alumnos')
    .select('id,nombre,email,fecha_de_vencimiento,gym_id')
    .is('deleted_at', null)
    .in('fecha_de_vencimiento', [hoyStr, tresDiasStr])

  const { data, error } = await query
  if (error) throw error

  const alumnosFiltrados = data?.filter(a => !EMAILS_IGNORADOS.includes(a.email?.toLowerCase())) || []

  if (!alumnosFiltrados.length) {
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
      await logGymEmail({
        gymId: gym_id,
        emailDestino: email,
        asunto: subject,
        tipo: venceHoy ? 'vencimiento_alumno_hoy' : 'vencimiento_alumno_3d',
        estado: 'enviado',
        endAt: fecha_de_vencimiento,
      })
      await delay(1000)
    } catch (error) {
      console.error(`❌ Error al enviar email a ${email}:`, error.message)
      await logGymEmail({
        gymId: gym_id,
        emailDestino: email,
        asunto: subject,
        tipo: venceHoy ? 'vencimiento_alumno_hoy' : 'vencimiento_alumno_3d',
        estado: 'error',
        errorMsg: error.message,
        endAt: fecha_de_vencimiento,
      })
    }
  }

  // Reconcilia con Brevo por si algún logGymEmail falló o Brevo aceptó algo no logueado
  try {
    await backfillBrevoLogs({})
  } catch (e) {
    console.error('⚠️ Backfill post-envío falló:', e.message)
  }
}

export async function enviarPruebaPlantillas() {
  const to = 'nicopereyra@gmail.com'
  const nombre = 'Nico'
  const subjectHoy = '📅 ¡Tu plan vence hoy!'
  const subjectTres = '⚠️ Tu plan vence en 3 días'

  const htmlHoy = plantillaVenceHoy(nombre)
  const textHoy = `${subjectHoy}\n\nPrueba de visualización de la plantilla de vencimiento HOY.\n\n— ${BRAND_NAME}`
  await sendBrevoEmail({ to, subject: subjectHoy, text: textHoy, html: htmlHoy })

  const htmlTres = plantillaVenceEnTres(nombre)
  const textTres = `${subjectTres}\n\nPrueba de visualización de la plantilla de vencimiento en 3 días.\n\n— ${BRAND_NAME}`
  await sendBrevoEmail({ to, subject: subjectTres, text: textTres, html: htmlTres })
}

// ===================================================================
//  VENCIMIENTO DE PLANES DE GIMNASIOS (Suscripciones a FitnessFlow)
// ===================================================================

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'nicopereyra855@gmail.com'
const FITNESSFLOW_GREEN = '#0dc985'

function plantillaVencimientoGymPlan({ gymName, planName, planPrice, endAt, gymLogo }) {
  const fechaVto = dayjs(endAt).format('DD/MM/YYYY')
  const esLogoPlaceholder = gymLogo?.includes('ui-avatars.com')
  const logo = (gymLogo && !esLogoPlaceholder) ? gymLogo : null

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Aviso de Vencimiento — Fitness Flow</title>
  <style>
    body { margin:0; padding:0; background:#f0f0f0; font-family:Arial,Helvetica,sans-serif; }
    .wrapper { width:100%; background:#f0f0f0; padding:20px 0; }
    .card { max-width:600px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.12); }
    .header { background:#1f1f1f; padding:32px 20px; text-align:center; }
    .header img { height:76px; width:76px; display:block; margin:0 auto 14px auto; }
    .header h1 { color:#ffffff; margin:0; font-size:20px; font-weight:700; letter-spacing:0.3px; }
    .header p { color:#aaaaaa; margin:6px 0 0 0; font-size:13px; }
    .body { padding:28px 20px; color:#333333; }
    .greeting { font-size:16px; margin:0 0 16px 0; }
    .intro { font-size:14px; line-height:1.6; color:#555555; margin:0 0 22px 0; }
    .plan-card { background:#f7f7f7; border-left:4px solid ${FITNESSFLOW_GREEN}; border-radius:10px; padding:18px 16px; margin:0 0 22px 0; }
    .plan-card .gym-row { display:flex; align-items:center; margin-bottom:12px; }
    .plan-card .gym-row img { height:36px; width:36px; border-radius:50%; object-fit:cover; margin-right:10px; }
    .plan-card table { width:100%; border-collapse:collapse; font-size:14px; color:#444; }
    .plan-card td { padding:7px 0; vertical-align:top; }
    .plan-card td:first-child { font-weight:700; white-space:nowrap; padding-right:12px; width:50%; }
    .expiry-date { color:#e53e3e; font-weight:700; }
    .payment-box { background:#ffffff; border:2px solid ${FITNESSFLOW_GREEN}; border-radius:10px; padding:22px 20px; margin:0 0 22px 0; }
    .payment-box h3 { color:${FITNESSFLOW_GREEN}; margin:0 0 18px 0; font-size:15px; text-align:center; font-weight:700; }
    .payment-table { width:100%; border-collapse:collapse; font-size:14px; }
    .payment-table tr td { padding:12px 8px; border-bottom:1px solid #e5e7eb; vertical-align:middle; }
    .payment-table tr:last-child td { border-bottom:none; }
    .payment-label { color:#666666; white-space:nowrap; width:130px; }
    .payment-value { color:#1f1f1f; font-weight:700; text-align:right; }
    .payment-alias { color:${FITNESSFLOW_GREEN}; font-size:18px; font-weight:800; letter-spacing:0.5px; }
    .deadline-banner { background:#fffbeb; border:1px solid #f59e0b; border-radius:8px; padding:13px 14px; margin:0 0 22px 0; font-size:13px; color:#92400e; text-align:center; line-height:1.5; }
    .reply-note { background:#f7f7f7; border-radius:8px; padding:14px 16px; font-size:13px; color:#555; line-height:1.6; margin:0 0 6px 0; }
    .footer { background:#f7f7f7; border-top:1px solid #e5e7eb; padding:16px; text-align:center; font-size:12px; color:#888888; }
    .footer strong { color:${FITNESSFLOW_GREEN}; }
    @media (max-width:480px) {
      .wrapper { padding:0; }
      .card { border-radius:0; box-shadow:none; }
      .body { padding:22px 16px; }
      .header { padding:26px 16px; }
      .payment-label { width:110px; }
      .payment-value { text-align:right; }
      .plan-card td:first-child { width:auto; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">

      <!-- HEADER -->
      <div class="header">
        <img src="${BRAND_LOGO_URL}" alt="Fitness Flow" />
        <h1>Aviso de Vencimiento de Plan</h1>
        <p>Suscripción a Fitness Flow</p>
      </div>

      <!-- BODY -->
      <div class="body">
        <p class="greeting">Hola, <strong>${gymName}</strong> 👋</p>
        <p class="intro">
          Tu suscripción a <strong>Fitness Flow</strong> ha vencido o está próxima a vencer.<br/>
          A continuación encontrás todos los detalles de tu plan:
        </p>

        <!-- Plan card -->
        <div class="plan-card">
          ${logo ? `<div class="gym-row"><img src="${logo}" alt="${gymName}" /><strong style="font-size:14px;">${gymName}</strong></div>` : ''}
          <table>
            <tr>
              <td>Plan contratado:</td>
              <td>${planName || 'Sin plan asignado'}</td>
            </tr>
            <tr>
              <td>Precio del plan:</td>
              <td>${planPrice != null ? '$' + Number(planPrice).toLocaleString('es-AR') : 'No especificado'}</td>
            </tr>
            <tr>
              <td>Fecha de vencimiento:</td>
              <td class="expiry-date">${fechaVto}</td>
            </tr>
          </table>
        </div>

        <!-- Deadline banner -->
        <div class="deadline-banner">
          ⚠️ <strong>El pago debe realizarse del 1 al 15 de cada mes</strong> para mantener tu acceso activo.
        </div>

        <!-- MP -->
        <div class="payment-box">
          <h3>Datos de pago</h3>
          <table class="payment-table">
            <tr>
              <td class="payment-label">Alias</td>
              <td class="payment-value payment-alias">fitnessflow.26</td>
            </tr>
            <tr>
              <td class="payment-label">A nombre de</td>
              <td class="payment-value">Angelo Fabian Pollastrini</td>
            </tr>
          </table>
          <div style="margin-top:14px;padding-top:16px;text-align:center;">
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6a/Brubank_logo.png" alt="Brubank" style="height:100px;width:auto;" />
          </div>
        </div>

        <!-- Reply note -->
        <div class="reply-note">
          📎 Una vez realizado el pago, <strong>respondé este correo adjuntando el comprobante</strong> para que podamos activar tu suscripción a la brevedad.
        </div>
      </div>

      <!-- FOOTER -->
      <div class="footer">
        Enviado automáticamente por <strong>Fitness Flow</strong> 💚
      </div>

    </div>
  </div>
</body>
</html>
  `
}

/**
 * Obtiene el email del administrador (role_id = 2) de un gimnasio
 */
async function getGymAdminEmail(gymId) {
  const { data: adminUser, error } = await supabase
    .from('users')
    .select('auth_user_id')
    .eq('gym_id', gymId)
    .eq('role_id', 2)
    .is('deleted_at', null)
    .limit(1)
    .single()

  if (error || !adminUser?.auth_user_id) return null

  const { data: authData, error: authError } = await supabase.auth.admin.getUserById(adminUser.auth_user_id)
  if (authError || !authData?.user?.email) return null

  return authData.user.email
}

/**
 * Obtiene todos los gimnasios cuya suscripción activa tiene end_at vencido (< hoy)
 */
async function getGymsConPlanVencido() {
  const ZONE = 'America/Argentina/Cordoba'
  const hoy = dayjs.tz(dayjs(), ZONE).startOf('day').toISOString()

  // Buscar suscripciones activas cuyo end_at ya pasó
  const { data: suscripciones, error } = await supabase
    .from('suscriptions')
    .select('*, gym_plans(*), gyms:gym_id(id, name, logo_url, settings)')
    .eq('is_active', true)
    .lt('end_at', hoy)
    .order('end_at', { ascending: true })

  if (error) throw error

  // También buscar suscripciones que venzan hoy o en los próximos 7 días
  const sieteDias = dayjs.tz(dayjs(), ZONE).add(7, 'day').endOf('day').toISOString()
  const { data: proximasAVencer, error: error2 } = await supabase
    .from('suscriptions')
    .select('*, gym_plans(*), gyms:gym_id(id, name, logo_url, settings)')
    .eq('is_active', true)
    .gte('end_at', hoy)
    .lte('end_at', sieteDias)
    .order('end_at', { ascending: true })

  if (error2) throw error2

  // Excluir planes Free
  const noEsFree = (s) => s.gym_plans?.name?.toLowerCase() !== 'free'

  return {
    vencidos: (suscripciones || []).filter(noEsFree),
    proximosAVencer: (proximasAVencer || []).filter(noEsFree),
  }
}

/**
 * PREVIEW: Muestra qué gimnasios tienen planes vencidos sin enviar mails
 */
export async function previewVencimientoGymPlans() {
  const { vencidos, proximosAVencer } = await getGymsConPlanVencido()

  const formatear = async (subs) => {
    const resultados = []
    for (const s of subs) {
      const emailAdmin = await getGymAdminEmail(s.gym_id)
      resultados.push({
        suscripcion_id: s.id,
        gym_id: s.gym_id,
        gym_nombre: s.gyms?.name || 'Sin nombre',
        gym_logo: s.gyms?.logo_url || null,
        plan_id: s.plan_id,
        plan_nombre: s.gym_plans?.name || 'Sin plan',
        plan_precio: s.gym_plans?.price ?? null,
        max_alumnos: s.gym_plans?.max_alumnos || null,
        features: {
          stats: s.gym_plans?.stats || false,
          classes: s.gym_plans?.classes || false,
          services: s.gym_plans?.services || false,
          appointments: s.gym_plans?.appointments || false,
          portal: s.gym_plans?.portal || false,
          settings: s.gym_plans?.settings || false,
          products: s.gym_plans?.products || false,
        },
        is_active: s.is_active,
        start_at: s.start_at,
        end_at: s.end_at,
        dias_vencido: dayjs().diff(dayjs(s.end_at), 'day'),
        email_destino: emailAdmin || 'Sin email de administrador',
      })
    }
    return resultados
  }

  const resultado = {
    fecha_consulta: dayjs().format('DD/MM/YYYY HH:mm'),
    vencidos: {
      total: vencidos.length,
      gimnasios: await formatear(vencidos),
    },
    proximos_a_vencer: {
      total: proximosAVencer.length,
      gimnasios: await formatear(proximosAVencer),
    },
  }

  console.log(`\n🔍 PREVIEW VENCIMIENTO GYM PLANS`)
  console.log(`   Vencidos: ${vencidos.length} | Próximos a vencer (7 días): ${proximosAVencer.length}\n`)

  return resultado
}

/**
 * ENVÍO REAL: Manda mails de vencimiento al administrador
 */
export async function enviarEmailsVencimientoGymPlans() {
  const { vencidos, proximosAVencer } = await getGymsConPlanVencido()
  const todos = [...vencidos, ...proximosAVencer]

  if (todos.length === 0) {
    return { enviados: 0, mensaje: 'No hay gimnasios con planes vencidos o por vencer.' }
  }

  let enviados = 0
  let errores = 0
  let sinEmail = 0
  const detalle = []

  for (const s of todos) {
    const gymName = s.gyms?.name || 'Gimnasio sin nombre'
    const planName = s.gym_plans?.name || 'Sin plan'
    const planPrice = s.gym_plans?.price ?? null
    const gymLogo = s.gyms?.logo_url || null
    const emailAdmin = await getGymAdminEmail(s.gym_id)

    if (!emailAdmin) {
      sinEmail++
      detalle.push({
        gym: gymName,
        plan: planName,
        precio: planPrice,
        vencimiento: dayjs(s.end_at).format('DD/MM/YYYY'),
        destinatario: null,
        estado: 'sin_email',
      })
      await logGymEmail({
        gymId: s.gym_id,
        emailDestino: null,
        asunto: `⚠️ Vencimiento de plan — ${gymName}`,
        estado: 'sin_email',
        planNombre: planName,
        planPrecio: planPrice,
        endAt: s.end_at,
      })
      continue
    }

    const subject = `⚠️ Vencimiento de plan — ${gymName}`
    const html = plantillaVencimientoGymPlan({
      gymName,
      planName,
      planPrice,
      endAt: s.end_at,
      gymLogo,
    })
    const text = `Vencimiento de plan de ${gymName}.\nPlan: ${planName}\nVencimiento: ${dayjs(s.end_at).format('DD/MM/YYYY')}\nRecordá abonar del 1 al 10 del mes.\n\n— Fitness Flow`

    try {
      await sendBrevoEmail({ to: emailAdmin, subject, text, html })
      enviados++
      detalle.push({
        gym: gymName,
        plan: planName,
        precio: planPrice,
        vencimiento: dayjs(s.end_at).format('DD/MM/YYYY'),
        destinatario: emailAdmin,
        estado: 'enviado',
      })
      await logGymEmail({
        gymId: s.gym_id,
        emailDestino: emailAdmin,
        asunto: subject,
        estado: 'enviado',
        planNombre: planName,
        planPrecio: planPrice,
        endAt: s.end_at,
      })
    } catch (err) {
      console.error(`❌ Error enviando mail de ${gymName} a ${emailAdmin}:`, err.message)
      errores++
      detalle.push({
        gym: gymName,
        plan: planName,
        precio: planPrice,
        vencimiento: dayjs(s.end_at).format('DD/MM/YYYY'),
        destinatario: emailAdmin,
        estado: 'error',
      })
      await logGymEmail({
        gymId: s.gym_id,
        emailDestino: emailAdmin,
        asunto: subject,
        estado: 'error',
        errorMsg: err.message,
        planNombre: planName,
        planPrecio: planPrice,
        endAt: s.end_at,
      })
    }
  }

  return {
    enviados,
    errores,
    sin_email: sinEmail,
    total: todos.length,
    detalle,
  }
}

/**
 * Obtiene logs de emails enviados a gimnasios, agrupados por gimnasio
 */
export async function getGymEmailLogs({ limit = 500 } = {}) {
  const { data, error } = await supabase
    .from('gym_email_logs')
    .select('*, gyms:gym_id(id, name, logo_url)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  const porGym = {}
  for (const row of data || []) {
    const gymId = row.gym_id
    if (!porGym[gymId]) {
      porGym[gymId] = {
        gym_id: gymId,
        gym_nombre: row.gyms?.name || 'Sin nombre',
        gym_logo: row.gyms?.logo_url || null,
        total: 0,
        ultimo_envio: row.created_at,
        emails: [],
      }
    }
    porGym[gymId].total += 1
    porGym[gymId].emails.push({
      id: row.id,
      email_destino: row.email_destino,
      asunto: row.asunto,
      tipo: row.tipo,
      estado: row.estado,
      error_msg: row.error_msg,
      plan_nombre: row.plan_nombre,
      plan_precio: row.plan_precio,
      end_at: row.end_at,
      created_at: row.created_at,
    })
  }

  return Object.values(porGym).sort(
    (a, b) => new Date(b.ultimo_envio).getTime() - new Date(a.ultimo_envio).getTime()
  )
}

/**
 * Backfill: trae eventos "sent" de Brevo para un día y los inserta en gym_email_logs.
 * Mapea email→gym_id consultando la tabla alumnos.
 * Evita duplicados: chequea si ya existe log con mismo email_destino + fecha (mismo día).
 */
export async function backfillBrevoLogs({ fecha = null } = {}) {
  const ZONE = 'America/Argentina/Cordoba'
  const dia = fecha || dayjs.tz(dayjs(), ZONE).format('YYYY-MM-DD')

  // Mapa email -> gym_id desde alumnos
  const { data: alumnos, error: alErr } = await supabase
    .from('alumnos')
    .select('email,gym_id')
    .is('deleted_at', null)
    .not('email', 'is', null)
  if (alErr) throw alErr

  const gymIdByEmail = {}
  for (const a of alumnos || []) {
    const k = a.email?.toLowerCase()
    if (k && !gymIdByEmail[k]) gymIdByEmail[k] = a.gym_id
  }

  // Logs ya existentes ese día para evitar duplicados
  const inicioDia = `${dia}T00:00:00`
  const finDia = `${dia}T23:59:59`
  const { data: existentes, error: exErr } = await supabase
    .from('gym_email_logs')
    .select('email_destino,asunto')
    .gte('created_at', inicioDia)
    .lte('created_at', finDia)
  if (exErr) throw exErr

  const yaLogueado = new Set(
    (existentes || []).map(e => `${e.email_destino?.toLowerCase()}|${e.asunto}`)
  )

  let offset = 0
  const limit = 100
  let insertados = 0
  let saltados = 0
  let sinGym = 0

  while (true) {
    const url = new URL('https://api.brevo.com/v3/smtp/statistics/events')
    url.searchParams.set('startDate', dia)
    url.searchParams.set('endDate', dia)
    url.searchParams.set('event', 'requests')
    url.searchParams.set('limit', String(limit))
    url.searchParams.set('offset', String(offset))
    url.searchParams.set('sort', 'desc')

    const res = await fetch(url.toString(), {
      headers: { 'api-key': BREVO_API_KEY, accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`Brevo ${res.status}: ${await res.text()}`)
    const json = await res.json()
    const events = json.events || []
    if (!events.length) break

    for (const ev of events) {
      const emailLower = ev.email?.toLowerCase()
      const gymId = gymIdByEmail[emailLower]
      if (!gymId) { sinGym++; continue }

      const key = `${emailLower}|${ev.subject || null}`
      if (yaLogueado.has(key)) { saltados++; continue }

      const subject = ev.subject || ''
      const venceHoy = subject.includes('vence hoy')
      const tipo = venceHoy ? 'vencimiento_alumno_hoy' : 'vencimiento_alumno_3d'

      const { error: insErr } = await supabase.from('gym_email_logs').insert({
        gym_id: gymId,
        email_destino: ev.email,
        asunto: ev.subject || null,
        tipo,
        estado: 'enviado',
        created_at: ev.date || undefined,
      })
      if (insErr) {
        console.error('⚠️ Insert log fail:', insErr.message)
        continue
      }
      yaLogueado.add(key)
      insertados++
    }

    if (events.length < limit) break
    offset += limit
  }

  return { fecha: dia, insertados, saltados, sin_gym: sinGym }
}

/**
 * TEST: Envía un mail de prueba a nicopereyra855@gmail.com para ver cómo se ve
 */
export async function enviarTestVencimientoGymPlan() {
  const TEST_EMAIL = 'nicopereyra855@gmail.com'

  const subject = '🧪 [TEST] Vencimiento de plan — Gimnasio Demo'
  const html = plantillaVencimientoGymPlan({
    gymName: 'Gimnasio Demo',
    planName: 'Plan Profesional',
    planPrice: 15000,
    endAt: dayjs().subtract(2, 'day').toISOString(),
    gymLogo: null,
  })
  const text = 'Este es un email de prueba para verificar la plantilla de vencimiento de plan de gimnasio.\n\n— Fitness Flow'

  await sendBrevoEmail({ to: TEST_EMAIL, subject, text, html })

  return { enviado: true, email: TEST_EMAIL }
}