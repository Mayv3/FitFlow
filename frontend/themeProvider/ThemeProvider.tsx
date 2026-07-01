'use client'

import { useEffect, useState } from 'react'
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material'
import { DEFAULT_THEME, createAppTheme } from './theme'
import { useDarkMode } from '@/context/DarkModeContext'

/**
 * Convierte un color hex (#rgb o #rrggbb) al formato HSL que usan los tokens
 * de shadcn en globals.css: "H S% L%" (sin coma, sin hsl()).
 * Devuelve null si el input no es un hex válido.
 */
function hexToHslToken(hex: string): string | null {
  if (typeof hex !== 'string') return null
  let h = hex.trim().replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return null

  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const lum = (max + min) / 2
  let hue = 0
  let sat = 0

  if (max !== min) {
    const d = max - min
    sat = lum > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        hue = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        hue = (b - r) / d + 2
        break
      default:
        hue = (r - g) / d + 4
    }
    hue /= 6
  }

  return `${Math.round(hue * 360)} ${Math.round(sat * 100)}% ${Math.round(lum * 100)}%`
}

/**
 * Sincroniza los tokens de color de shadcn (--primary / --ring) con el color
 * primario del gym aplicado por MUI. Así un único color de marca controla
 * tanto los componentes MUI como los shadcn (bg-primary, ring, etc.) en runtime.
 */
function syncShadcnTokens(primaryHex: string) {
  if (typeof document === 'undefined') return
  const token = hexToHslToken(primaryHex)
  if (!token) return
  const root = document.documentElement
  root.style.setProperty('--primary', token)
  root.style.setProperty('--ring', token)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState(DEFAULT_THEME)
  const { isDarkMode } = useDarkMode()

  useEffect(() => {
    const refresh = () => {
      const newTheme = createAppTheme(isDarkMode)
      setTheme(newTheme)
      syncShadcnTokens(newTheme.palette.primary.main)
    }

    // Usar setTimeout para evitar actualizaciones durante el renderizado
    const timeoutId = setTimeout(refresh, 0)

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'gym_settings') {
        setTimeout(refresh, 0)
      }
    }
    const onCustom = () => setTimeout(refresh, 0)
    const onDarkModeChange = () => setTimeout(refresh, 0)

    window.addEventListener('storage', onStorage)
    window.addEventListener('gym-settings-updated', onCustom as EventListener)
    window.addEventListener('darkModeChanged', onDarkModeChange as EventListener)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('gym-settings-updated', onCustom as EventListener)
      window.removeEventListener('darkModeChanged', onDarkModeChange as EventListener)
    }
  }, [isDarkMode])

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  )
}
