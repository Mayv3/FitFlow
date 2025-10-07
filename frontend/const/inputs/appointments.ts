import { Field } from "@/models/Fields/Field"
import { fechaHoyArgentinaISO } from "@/utils/date/dateUtils"

export const getInputFieldsTurnos = ({
    serviceOptions,
    searchFromCache,
}: {
    serviceOptions: { label: string; value: number }[]
    searchFromCache: (gymId: string, q: string) => { label: string; value: any }[]
}): Field[] => [
        {
            label: "Título (obligatorio)",
            name: "titulo",
            type: "string",
            required: true,
            placeholder: "Ej: Evaluación inicial",
            minLength: 3,
            maxLength: 60,
            inputProps: {
                style: { textTransform: 'capitalize' },
            },
        },
        {
            label: "Servicio (obligatorio)",
            name: "servicio_id",
            type: "select",
            options: serviceOptions,
            required: true,
            placeholder: "Selecciona un servicio",
        },
        {
            label: "Profesional (obligatorio)",
            name: "profesional",
            type: "string",
            required: true,
            placeholder: "Ej: Lic. Ana Gómez",
            minLength: 3,
            maxLength: 60,
            inputProps: {
                style: { textTransform: 'capitalize' },
            },
        },
        {
            label: "Alumno (obligatorio)",
            name: "alumno_id",
            type: "search-select",
            required: true,
            placeholder: "Busca un alumno por nombre o DNI",
            searchFromCache,
        },
        {
            label: "Fecha y hora de inicio (obligatorio)",
            name: "inicio_at",
            type: "date",
            required: true,
            defaultValue: fechaHoyArgentinaISO,
            inputProps: { type: "datetime-local", min: fechaHoyArgentinaISO },
        },
        {
            label: "Color",
            name: "color",
            type: "color",
            required: false,
            defaultValue: "#1976d2",
        },
        {
            label: "Emails de notificación",
            name: "emails",
            type: "string",
            required: false,
            placeholder: "Ej: juan@gmail.com, ana@hotmail.com",
            inputProps: {
                style: { textTransform: 'lowercase' },
            },
        },
    ]

export const layoutTurnos = {
    titulo: { rowStart: 1, colStart: 1, colSpan: 12 },
    servicio_id: { rowStart: 2, colStart: 1, colSpan: 6 },
    profesional: { rowStart: 2, colStart: 7, colSpan: 6 },
    alumno_id: { rowStart: 3, colStart: 1, colSpan: 12 },
    inicio_at: { rowStart: 4, colStart: 1, colSpan: 8 },
    color: { rowStart: 4, colStart: 9, colSpan: 4 },
    emails: { rowStart: 5, colStart: 1, colSpan: 12 },
}

