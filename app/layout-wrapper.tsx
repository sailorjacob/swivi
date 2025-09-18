"use client"

import { useEffect } from "react"

export function DarkThemeWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Force dark theme on mount
    document.documentElement.classList.add('dark')
    document.documentElement.setAttribute('data-theme', 'dark')
  }, [])

  return (
    <div className="dark">
      {children}
    </div>
  )
}
