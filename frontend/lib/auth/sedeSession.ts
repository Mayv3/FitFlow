import Cookies from 'js-cookie'
import { Gym } from '@/models/Gym/Gym'

export const SEDE_STORAGE_KEY = 'fitflow-active-gym-id'

/** Actualiza el estado local de la sede antes de recargar todas las consultas. */
export function aplicarSede(sede: Gym) {
  Cookies.set('gym_id', sede.id)
  Cookies.set('gym_name', sede.name)
  sessionStorage.setItem('gym_settings', JSON.stringify(sede.settings || {}))
  sessionStorage.setItem('gym_logo_url', sede.logo_url || '')
  localStorage.setItem(SEDE_STORAGE_KEY, sede.id)
  window.location.reload()
}
