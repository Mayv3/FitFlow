'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type DarkModeContextType = {
  isDarkMode: boolean
  toggleDarkMode: () => void
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined)

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Leer preferencia almacenada al iniciar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('darkMode')
      if (savedMode !== null) {
        setIsDarkMode(JSON.parse(savedMode))
      } else {
        // Usar preferencia del sistema si no hay preferencia guardada
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setIsDarkMode(prefersDark)
      }
      setIsMounted(true)
    }
  }, [])

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newValue = !prev
      localStorage.setItem('darkMode', JSON.stringify(newValue))
      window.dispatchEvent(new CustomEvent('darkModeChanged', { detail: { isDarkMode: newValue } }))
      return newValue
    })
  }

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  )
}

export function useDarkMode() {
  const context = useContext(DarkModeContext)
  if (!context) {
    throw new Error('useDarkMode debe ser usado dentro de DarkModeProvider')
  }
  return context
}
