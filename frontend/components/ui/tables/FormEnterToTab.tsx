"use client"

import React from "react"

interface Props extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode
}

export const FormEnterToTab: React.FC<Props> = ({ children, ...formProps }) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== "Enter") return

    const target = e.target as HTMLElement

    if (target instanceof HTMLSelectElement) {
      return // 🔹 no interceptamos el Enter dentro del select
    }

    if (
      (target instanceof HTMLInputElement && target.type === "submit") ||
      (target instanceof HTMLButtonElement && target.type === "submit")
    ) {
      return
    }

    const form = e.currentTarget
    const focusables = Array.from(form.elements).filter((el) => {
      const isFormControl =
        el instanceof HTMLInputElement ||
        el instanceof HTMLSelectElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLButtonElement

      if (!isFormControl) return false
      if ((el as any).disabled) return false

      if (
        el instanceof HTMLButtonElement &&
        (el.closest(".MuiInputAdornment-root") || el.querySelector("svg"))
      ) {
        return false
      }

      return true
    }) as HTMLElement[]

    const idx = focusables.indexOf(target)
    if (idx > -1) {
      e.preventDefault()
      const next = focusables[idx + 1]
      if (next) {
        next.focus()
        if (next instanceof HTMLInputElement) next.select?.()
      }
    }
  }

  return (
    <form {...formProps} onKeyDown={handleKeyDown}>
      {children}
    </form>
  )
}
