export const OWNER = 1
export const ADMINISTRADOR = 2
export const RECEPCIONISTA = 3
export const SOCIO = 4

export const ROLE_ROUTES: Record<string, string> = {
    [ADMINISTRADOR]: "/dashboard/administrator/profile",
    [RECEPCIONISTA]: "/dashboard/receptionist/profile",
}