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

export function LightThemeWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Force light theme on mount
    document.documentElement.classList.remove('dark')
    document.documentElement.setAttribute('data-theme', 'light')

    // Also remove dark class from body to ensure complete override
    document.body.classList.remove('dark')

    // Return a cleanup function to restore dark theme when component unmounts
    return () => {
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
      document.body.classList.add('dark')
    }
  }, [])

  return (
    <div className="light">
      {children}
    </div>
  )
}
