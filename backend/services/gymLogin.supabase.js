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

    const [planResult, pagosResult, planesResult, clasesResult] = await Promise.all([
        alumno.plan_id
            ? supabaseAdmin
                .from('planes_precios')
                .select('id, nombre, precio, numero_clases, color')
                .eq('id', alumno.plan_id)
                .is('deleted_at', null)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        supabaseAdmin
            .from('pagos')
            .select('id, monto_total, fecha_de_pago, fecha_de_venc, tipo, responsable')
            .eq('alumno_id', alumno.id)
            .is('deleted_at', null)
            .order('fecha_de_pago', { ascending: false })
            .limit(10),
        supabaseAdmin
            .from('planes_precios')
            .select('id, nombre, precio, numero_clases, color')
            .eq('gym_id', gymId)
            .is('deleted_at', null)
            .order('precio', { ascending: true }),
        supabaseAdmin
            .from('clases_inscripciones')
            .select(`
      id,
      es_fija,
      created_at,
      sesion_id,
      clases_sesiones (
        id,
        dia_semana,
        hora_inicio,
        capacidad,
        clase_id,
        clases (
          id,
          nombre,
          descripcion,
          color
        )
      )
    `)
            .eq('alumno_id', alumno.id)
            .order('created_at', { ascending: false }),
    ]);

    const planInfo = (!planResult.error && planResult.data) ? planResult.data : null;
    const pagos = pagosResult.data;
    const pagosError = pagosResult.error;
    if (pagosError) {
        console.error('Error obteniendo pagos:', pagosError);
    }

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

    const clasesDisponibles = alumno.clases_pagadas
        ? alumno.clases_pagadas - (alumno.clases_realizadas || 0)
        : null;

    const porcentajeClasesUsadas = alumno.clases_pagadas && alumno.clases_pagadas > 0
        ? Math.round((alumno.clases_realizadas || 0) / alumno.clases_pagadas * 100)
        : 0;

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

    const planes = planesResult.data;
    if (planesResult.error) {
        console.error('Error obteniendo planes:', planesResult.error);
    }

    const clasesInscritas = clasesResult.data;
    if (clasesResult.error) {
        console.error('Error obteniendo clases inscritas:', clasesResult.error);
    }

    // Filtrar inscripciones fijas vencidas
    const today = new Date().toISOString().slice(0, 10);
    const clasesInscritasActivas = (clasesInscritas || []).filter(inscripcion =>
        !inscripcion.es_fija || (alumno.fecha_de_vencimiento ?? '') >= today
    );

    // Formatear las clases inscritas
    const clasesFormateadas = clasesInscritasActivas.map(inscripcion => {
        // Calcular la próxima fecha de la clase
        let proxima_fecha = null;
        if (inscripcion.clases_sesiones?.dia_semana !== null && inscripcion.clases_sesiones?.dia_semana !== undefined) {
            const hoy = new Date();
            const diaClase = inscripcion.clases_sesiones.dia_semana;
            const diaActual = hoy.getDay();
            
            let diasHastaClase = diaClase - diaActual;
            if (diasHastaClase <= 0) {
                diasHastaClase += 7;
            }
            
            const fechaProxima = new Date(hoy);
            fechaProxima.setDate(hoy.getDate() + diasHastaClase);
            proxima_fecha = fechaProxima.toISOString().split('T')[0];
        }

        return {
            id: inscripcion.id,
            es_fija: inscripcion.es_fija,
            fecha_inscripcion: inscripcion.created_at,
            clase_nombre: inscripcion.clases_sesiones?.clases?.nombre || 'Sin nombre',
            clase_color: inscripcion.clases_sesiones?.clases?.color || '#2196F3',
            dia_semana: inscripcion.clases_sesiones?.dia_semana,
            hora_inicio: inscripcion.clases_sesiones?.hora_inicio,
            proxima_fecha: proxima_fecha,
        };
    });

    return {
        datosPersonales: {
            id: alumno.id,
            nombre: alumno.nombre,
            dni: alumno.dni,
            email: alumno.email,
            telefono: alumno.telefono,
            fecha_nacimiento: alumno.fecha_nacimiento,
            sexo: alumno.sexo,
        },

        plan: planInfo ? {
            id: planInfo.id,
            nombre: planInfo.nombre,
            precio: planInfo.precio,
            duracion_dias: planInfo.duracion_dias,
        } : null,

        membresia: {
            fecha_inicio: alumno.fecha_inicio,
            fecha_vencimiento: alumno.fecha_de_vencimiento,
            dias_restantes: diasRestantes,
            estado: estadoMembresia,
            porcentaje_tiempo_usado: porcentajeTiempoUsado,
        },

        clases: {
            clases_pagadas: alumno.clases_pagadas,
            clases_realizadas: alumno.clases_realizadas || 0,
            clases_disponibles: clasesDisponibles,
            porcentaje_uso: porcentajeClasesUsadas,
        },

        pagos: pagos || [],
        planes_disponibles: planes || [],
        clases_inscritas: clasesFormateadas || [],

        totales: {
            total_pagado: pagos ? pagos
                .filter(p => p.estado === 'pagado')
                .reduce((sum, p) => sum + (p.monto || 0), 0) : 0,
            cantidad_pagos: pagos ? pagos.filter(p => p.estado === 'pagado').length : 0,
        }
    };
};


