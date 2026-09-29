'use client'

import { Moon, Sun } from 'lucide-react'
import { useDarkMode } from '@/context/DarkModeContext'

// Botón sol/luna. Usa el mismo modo oscuro que el resto de la app: la clase
// `dark` en <html>, guardada en localStorage.
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const label = isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'

  return (
    <button type="button" onClick={toggleDarkMode} className={className} aria-label={label} title={label}>
      {isDarkMode ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
    </button>
  )
}
