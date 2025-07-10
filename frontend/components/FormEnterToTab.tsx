// components/FormEnterToTab.tsx
"use client"

import React from "react"

interface Props extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode
}

export const FormEnterToTab: React.FC<Props> = ({
  children,
  ...formProps
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== "Enter") return

    const target = e.target as HTMLElement

    if (
      (target instanceof HTMLInputElement && target.type === "submit") ||
      (target instanceof HTMLButtonElement && target.type === "submit")
    ) {
      return
    }

    const form = e.currentTarget
    const focusables = Array.from(form.elements).filter(
      (el) =>
        (el instanceof HTMLInputElement ||
          el instanceof HTMLSelectElement ||
          el instanceof HTMLTextAreaElement ||
          el instanceof HTMLButtonElement) &&
        !(el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement).disabled
    ) as HTMLElement[]

    const idx = focusables.indexOf(target)
    if (idx > -1) {
      e.preventDefault()
      const next = focusables[idx + 1]
      if (next) next.focus()
    }
  }

  return (
    <form {...formProps} onKeyDown={handleKeyDown}>
      {children}
    </form>
  )
}
