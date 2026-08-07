/** Fila liviana de /api/alumnos/simple: solo lo que necesitan los selects. */
export interface AlumnoSimple {
    id: number;
    nombre: string;
    dni: string;
    email?: string | null;
}

export interface Member {
    id: string;
    nombre: string;
    dni: string;
    email: string;
    telefono: string;
    sexo: string;
    fecha_nacimiento: string;
    clases_pagadas: number;
    clases_realizadas: number;
    plan: string;
    fecha_inicio: string;
    /**
     * Nombre real de la columna en Supabase; es lo que devuelve la API.
     * `fecha_vencimiento` queda como alias legacy de payloads viejos, por eso
     * los callsites leen `fecha_de_vencimiento ?? fecha_vencimiento`.
     */
    fecha_de_vencimiento?: string;
    fecha_vencimiento: string;
    gym_id: string;
    plan_id: number | null | undefined | string;
    plan_nombre: string | null;
    /** Denormalizado del plan en /api/alumnos/expired. */
    plan_precio?: number | null;
    origen?: 'instagram' | 'facebook' | 'recomendacion' | 'otro';
}

/**
 * Lo que sale del FormModal de alumnos. Los contadores viajan como string
 * porque los inputs `type: 'number'` no se castean en el form (solo los
 * select); el backend los convierte.
 */

export interface MemberFormValues {
    nombre?: string;
    dni?: string;
    email?: string;
    telefono?: string;
    plan_id?: number | string | null;
    sexo?: string;
    origen?: string;
    clases_pagadas?: number | string;
    clases_realizadas?: number | string;
    fecha_de_vencimiento?: string;
    fecha_nacimiento?: string;
    fecha_inicio?: string;
    /** Lo agrega el callsite al crear; no es un campo del form. */
    gym_id?: string;
    /** Denormalizado del plan elegido, viaja en algunos updates. */
    plan_nombre?: string | null;
}