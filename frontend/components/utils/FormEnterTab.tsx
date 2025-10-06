"use client"

import React from "react"

interface Props extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode
}

export const FormEnterToTab: React.FC<Props> = ({ children, ...formProps }) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== "Enter") return

    const form = e.currentTarget
    const target = e.target as HTMLElement

    if (target instanceof HTMLTextAreaElement) return

    if (
      (target instanceof HTMLInputElement && target.type === "submit") ||
      (target instanceof HTMLButtonElement && target.type === "submit")
    ) {
      return
    }

    e.preventDefault()

    const focusables = Array.from(form.elements).filter((el) => {
      if (!(el instanceof HTMLElement)) return false
      const isFocusable =
        el instanceof HTMLInputElement ||
        el instanceof HTMLSelectElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLButtonElement

      return isFocusable && !el.hasAttribute("disabled") && el.tabIndex !== -1
    }) as HTMLElement[]

    const idx = focusables.indexOf(target)
    if (idx === -1) return

    const next = focusables[idx + 1]
    if (next) next.focus()
    else {
      const submitBtn = focusables.find(
        (el) =>
          (el instanceof HTMLButtonElement && el.type === "submit") ||
          (el instanceof HTMLInputElement && el.type === "submit")
      )
      if (submitBtn) submitBtn.focus()
    }
  }

  return (
    <form {...formProps} onKeyDown={handleKeyDown}>
      {children}
    </form>
  )
}
