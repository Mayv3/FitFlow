'use client'

import { useEffect, useState } from 'react'
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material'
import { DEFAULT_THEME, createAppTheme } from './theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState(DEFAULT_THEME)

  useEffect(() => {
    const refresh = () => setTheme(createAppTheme())
    refresh()

    const onStorage = (e: StorageEvent) => { if (e.key === 'gym_settings') refresh() }
    const onCustom = () => refresh()

    window.addEventListener('storage', onStorage)
    window.addEventListener('gym-settings-updated', onCustom as EventListener)

    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('gym-settings-updated', onCustom as EventListener)
    }
  }, [])

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  )
}
