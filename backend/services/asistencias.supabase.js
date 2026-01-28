import { supabase } from '../db/supabaseClient.js'
import { fechaArgentina, horaArgentina } from '../utilities/moment.js'

export async function getAllAsistencias(gymId) {
  const { data, error } = await supabase
    .from('asistencias')
    .select('*')
    .eq('gym_id', gymId)
    .order('fecha', { ascending: false })
    .order('hora', { ascending: false })
  if (error) throw error
  return data
}

export async function createAsistencia(supa, asistencia, gymId) {
  console.time("createAsistencia-query")
  const dniRaw = asistencia?.dni ?? asistencia?.DNI
  if (!dniRaw) throw new Error('Falta DNI')
  const dni = String(dniRaw).trim()

  const { data: alumno, error: errAlumno } = await supa
    .from('alumnos')
    .select('id, nombre, email, plan_id, clases_realizadas, clases_pagadas, fecha_de_vencimiento, gym_id')
    .eq('dni', dni)
    .eq('gym_id', gymId)
    .maybeSingle()

  if (errAlumno) throw errAlumno
  if (!alumno) throw new Error(`No existe un alumno con ese DNI en este gimnasio`)

  let planNombre = null
  if (alumno.plan_id) {
    const { data: plan } = await supa
      .from('planes_precios')
      .select('id, nombre, numero_clases')
      .eq('id', alumno.plan_id)
      .maybeSingle()
    planNombre = plan?.nombre ?? null
  }

  const { data: asistenciaHoy } = await supa
    .from('asistencias')
    .select('id')
    .eq('alumno_id', alumno.id)
    .eq('fecha', fechaArgentina())
    .eq('gym_id', gymId)
    .maybeSingle()
  if (asistenciaHoy) throw new Error('El alumno ya registró asistencia hoy')

  const pag = alumno.clases_pagadas ?? 0
  const rea = alumno.clases_realizadas ?? 0
  if (pag > 0 && rea >= pag) {
    throw new Error('El alumno ya llegó al límite de clases de su plan')
  }

  if (alumno.fecha_de_vencimiento) {
    const hoyArg = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' })
    )

    const hoy = new Date(hoyArg.getFullYear(), hoyArg.getMonth(), hoyArg.getDate())
    const venc = new Date(alumno.fecha_de_vencimiento)
    const vencimiento = new Date(venc.getFullYear(), venc.getMonth(), venc.getDate())

    if (vencimiento <= hoy) {
      if (vencimiento.getTime() === hoy.getTime()) {
        throw new Error(`El plan vence hoy (${alumno.fecha_de_vencimiento}). No se permite registrar asistencia.`)
      }
      throw new Error(`El alumno tiene el plan vencido (venció el ${alumno.fecha_de_vencimiento})`)
    }
  }

  const payload = {
    fecha: fechaArgentina(),
    hora: horaArgentina(),
    alumno_id: alumno.id,
    plan_id: alumno.plan_id,
    gym_id: gymId,
  }

  const { data: nueva, error } = await supa
    .from('asistencias')
    .insert(payload)
    .select()
    .single()
  if (error) throw error

  await supa.from('alumnos')
    .update({ clases_realizadas: rea + 1 })
    .eq('id', alumno.id)

  const realizadas = rea + 1
  const restantes = Math.max((pag ?? 0) - realizadas, 0)
  const percent = pag > 0 ? Math.min(Math.round((realizadas * 100) / pag), 100) : 0

  const summary = {
    alumno: {
      id: alumno.id,
      nombre: alumno.nombre ?? '—',
      email: alumno.email ?? '—',
      dni,
    },
    plan: {
      id: alumno.plan_id ?? null,
      nombre: planNombre ?? '—',
      clases_pagadas: pag,
      clases_realizadas: realizadas,
      clases_restantes: restantes,
      progreso_pct: percent,
    },
    vencimiento: alumno.fecha_de_vencimiento ?? null,
    gym_id: gymId,
  }

  console.timeEnd("createAsistencia-query")
  return { asistencia: nueva, summary }
}

export async function getAsistenciaById(id, gymId) {
  const { data, error } = await supabase
    .from('asistencias')
    .select('*')
    .match({ id, gym_id: gymId })
    .single()
  if (error) throw error
  return data
}

export async function deleteAsistencia(id, gymId) {
  const { data, error } = await supabase
    .from('asistencias')
    .delete()
    .match({ id, gym_id: gymId })
    .single()
  if (error) throw error
  return data
}
