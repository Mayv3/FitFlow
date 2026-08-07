/**
 * JSONB `settings` del gym: el theme que se guarda al crear/editar el gym mas
 * los flags de modulos. Todo opcional porque los gyms viejos no lo traen.
 */
export interface GymSettings {
  colors?: {
    primary?: string
    secondary?: string
    background?: string
    paper?: string
    textPrimary?: string
    textSecondary?: string
  }
  typography?: { fontFamily?: string }
  shape?: { borderRadius?: number }
  whatsapp_module_enabled?: boolean
  /** Sesion de WhatsApp del gym: `admin_jid` es el numero vinculado. */
  whatsapp?: { admin_jid?: string | null }
}

/** Fila de /api/gyms. `settings` solo viene con `include_settings=true` en el detalle. */
export interface Gym {
  id: string
  name: string
  logo_url?: string | null
  settings?: GymSettings
}
