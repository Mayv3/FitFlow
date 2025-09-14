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
            label: "Fecha y hora de fin (obligatorio)",
            name: "fin_at",
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
    ]

export const layoutTurnos = {
    titulo: { rowStart: 1, colStart: 1, colSpan: 12 },
    servicio_id: { rowStart: 2, colStart: 1, colSpan: 6 },
    profesional: { rowStart: 2, colStart: 7, colSpan: 6 },
    alumno_id: { rowStart: 3, colStart: 1, colSpan: 12 }, // 👈 se comporta como en pagos
    inicio_at: { rowStart: 4, colStart: 1, colSpan: 4 },
    fin_at: { rowStart: 4, colStart: 5, colSpan: 4 },
    color: { rowStart: 4, colStart: 9, colSpan: 4 },
}
