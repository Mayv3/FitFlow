import { supabaseAdmin } from '../db/supabaseClient.js';

export const loginByDniAndGym = async (dni, gymId) => {
    console.log(`[loginByDniAndGym] Buscando alumno con DNI ${dni} en gym ${gymId}`);

    const { data, error } = await supabaseAdmin
        .from('alumnos')
        .select(`
      id,
      nombre,
      dni,
      email,
      telefono,
      fecha_nacimiento,
      plan_id,
      gym_id,
      sexo,
      fecha_inicio,
      fecha_de_vencimiento,
      clases_pagadas,
      clases_realizadas
    `)
        .eq('dni', dni)
        .eq('gym_id', gymId)
        .is('deleted_at', null)
        .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Alumno no encontrado en este gimnasio');

    return data;
};

export const getAlumnoCompleteInfo = async (dni, gymId) => {
    console.log(`[getAlumnoCompleteInfo] Obteniendo info completa del alumno con DNI ${dni} en gym ${gymId}`);

    // Obtener datos del alumno
    const { data: alumno, error: alumnoError } = await supabaseAdmin
        .from('alumnos')
        .select(`
      id,
      nombre,
      dni,
      email,
      telefono,
      fecha_nacimiento,
      plan_id,
      gym_id,
      sexo,
      fecha_inicio,
      fecha_de_vencimiento,
      clases_pagadas,
      clases_realizadas
    `)
        .eq('dni', dni)
        .eq('gym_id', gymId)
        .is('deleted_at', null)
        .maybeSingle();

    if (alumnoError) throw alumnoError;
    if (!alumno) throw new Error('Alumno no encontrado en este gimnasio');

    // Obtener información del plan si existe
    let planInfo = null;
    if (alumno.plan_id) {
        const { data: plan, error: planError } = await supabaseAdmin
            .from('planes_precios')
            .select('id, nombre, precio, numero_clases, color')
            .eq('id', alumno.plan_id)
            .is('deleted_at', null)
            .maybeSingle();

        if (!planError && plan) {
            planInfo = plan;
        }
    }

    // Obtener historial de pagos
    const { data: pagos, error: pagosError } = await supabaseAdmin
        .from('pagos')
        .select('id, monto_total, fecha_de_pago, fecha_de_venc, tipo, responsable')
        .eq('alumno_id', alumno.id)
        .is('deleted_at', null)
        .order('fecha_de_pago', { ascending: false })
        .limit(10);

    if (pagosError) {
        console.error('Error obteniendo pagos:', pagosError);
    }

    // Calcular días restantes
    let diasRestantes = null;
    let estadoMembresia = 'inactivo';

    if (alumno.fecha_de_vencimiento) {
        const hoy = new Date();
        const fechaVencimiento = new Date(alumno.fecha_de_vencimiento);
        const diffTime = fechaVencimiento.getTime() - hoy.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        diasRestantes = diffDays > 0 ? diffDays : 0;
        estadoMembresia = diffDays > 0 ? 'activo' : 'vencido';
    }

    // Calcular clases disponibles
    const clasesDisponibles = alumno.clases_pagadas
        ? alumno.clases_pagadas - (alumno.clases_realizadas || 0)
        : null;

    // Calcular porcentaje de uso de clases
    const porcentajeClasesUsadas = alumno.clases_pagadas && alumno.clases_pagadas > 0
        ? Math.round((alumno.clases_realizadas || 0) / alumno.clases_pagadas * 100)
        : 0;

    // Calcular porcentaje de tiempo usado del plan
    let porcentajeTiempoUsado = 0;
    if (alumno.fecha_inicio && alumno.fecha_de_vencimiento) {
        const fechaInicio = new Date(alumno.fecha_inicio);
        const fechaFin = new Date(alumno.fecha_de_vencimiento);
        const hoy = new Date();

        const tiempoTotal = fechaFin.getTime() - fechaInicio.getTime();
        const tiempoTranscurrido = hoy.getTime() - fechaInicio.getTime();

        porcentajeTiempoUsado = Math.min(
            Math.max(Math.round((tiempoTranscurrido / tiempoTotal) * 100), 0),
            100
        );
    }

    return {
        // Datos personales
        datosPersonales: {
            id: alumno.id,
            nombre: alumno.nombre,
            dni: alumno.dni,
            email: alumno.email,
            telefono: alumno.telefono,
            fecha_nacimiento: alumno.fecha_nacimiento,
            sexo: alumno.sexo,
        },

        // Información del plan
        plan: planInfo ? {
            id: planInfo.id,
            nombre: planInfo.nombre,
            precio: planInfo.precio,
            duracion_dias: planInfo.duracion_dias,
        } : null,

        // Estado de la membresía
        membresia: {
            fecha_inicio: alumno.fecha_inicio,
            fecha_vencimiento: alumno.fecha_de_vencimiento,
            dias_restantes: diasRestantes,
            estado: estadoMembresia,
            porcentaje_tiempo_usado: porcentajeTiempoUsado,
        },

        // Clases
        clases: {
            clases_pagadas: alumno.clases_pagadas,
            clases_realizadas: alumno.clases_realizadas || 0,
            clases_disponibles: clasesDisponibles,
            porcentaje_uso: porcentajeClasesUsadas,
        },

        // Historial de pagos
        pagos: pagos || [],

        // Totales
        totales: {
            total_pagado: pagos ? pagos
                .filter(p => p.estado === 'pagado')
                .reduce((sum, p) => sum + (p.monto || 0), 0) : 0,
            cantidad_pagos: pagos ? pagos.filter(p => p.estado === 'pagado').length : 0,
        }
    };
};
