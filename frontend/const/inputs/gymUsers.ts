
import { Field } from "@/models/Fields/Field"

export const getInputFieldsGymUsers: Field[] = [
  {
    label: "Nombre y apellido",
    name: "name",
    type: "string",
    required: true,
    minLength: 3,
    maxLength: 10,
    placeholder: "Ej: Juan Pérez",
    regex: /^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]*$/,
  },
  {
    label: "DNI",
    name: "dni",
    type: "string",
    required: true,
    minLength: 7,
    maxLength: 8,
    placeholder: "Ej: 38123456",
    regex: /^\d*$/,
  },
  {
    label: "Email",
    name: "email",
    type: "email",
    required: true,
    minLength: 5,
    maxLength: 100,
    placeholder: "ejemplo@correo.com",
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  {
    label: "Contraseña",
    name: "password",
    type: "password",
    required: true,
    minLength: 6,
    maxLength: 30,
    placeholder: "Mínimo 6 caracteres",
  },
]
