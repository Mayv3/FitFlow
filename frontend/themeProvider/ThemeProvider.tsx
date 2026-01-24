'use client'

import { useEffect, useState } from 'react'
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material'
import { DEFAULT_THEME, createAppTheme } from './theme'
import { useDarkMode } from '@/context/DarkModeContext'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState(DEFAULT_THEME)
  const { isDarkMode } = useDarkMode()

  useEffect(() => {
    const refresh = () => {
      const newTheme = createAppTheme(isDarkMode)
      setTheme(newTheme)
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
