import { Field } from "@/models/Fields/Field"
import { fechaHoyArgentinaISO, horaActualArgentina } from "@/utils/date/dateUtils"

export const getInputFieldsTurnos = (): Field[] => [
    {
        label: "Título (obligatorio)",
        name: "titulo",
        type: "string",
        required: true,
        placeholder: "Ej: Evaluación inicial",
        minLength: 3,
        maxLength: 60,
    },
    {
        label: "Servicio (obligatorio)",
        name: "servicio",
        type: "string",
        required: true,
        placeholder: "Ej: Nutrición",
        minLength: 3,
        maxLength: 40,
    },
    {
        label: "Profesional (obligatorio)",
        name: "profesional",
        type: "string",
        required: true,
        placeholder: "Ej: Lic. Ana Gómez",
        minLength: 3,
        maxLength: 60,
    },
    {
        label: "Miembro (obligatorio)",
        name: "miembro",
        type: "string",
        required: true,
        placeholder: "Ej: Juan Pérez",
        minLength: 3,
        maxLength: 60,
    },
    {
        label: "Fecha y hora de inicio (obligatorio)",
        name: "inicio_at",
        type: "date",
        required: true,
        defaultValue: fechaHoyArgentinaISO,
        inputProps: {
            type: "datetime-local",
            min: fechaHoyArgentinaISO,
        },
    },
    {
        label: "Fecha y hora de fin (obligatorio)",
        name: "fin_at",
        type: "date",
        required: true,
        defaultValue: fechaHoyArgentinaISO,
        inputProps: {
            type: "datetime-local",
            min: fechaHoyArgentinaISO,
        },
    },
]

export const layoutTurnos = {
    titulo: { rowStart: 1, colStart: 1, colSpan: 12 },
    servicio: { rowStart: 2, colStart: 1, colSpan: 6 },
    profesional: { rowStart: 2, colStart: 7, colSpan: 6 },
    miembro: { rowStart: 3, colStart: 1, colSpan: 12 },
    inicio_at: { rowStart: 4, colStart: 1, colSpan: 6 },
    fin_at: { rowStart: 4, colStart: 7, colSpan: 6 },
}