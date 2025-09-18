"use client"

import { useEffect } from "react"

export default function OwningManhattanLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Store original theme state
    const originalTheme = document.documentElement.classList.contains('dark')
    const originalDataTheme = document.documentElement.getAttribute('data-theme')
    
    // Force light theme for owning manhattan only
    document.documentElement.classList.remove('dark')
    document.documentElement.setAttribute('data-theme', 'light')
    
    // Cleanup function to restore theme when leaving
    return () => {
      if (originalTheme) {
        document.documentElement.classList.add('dark')
      }
      if (originalDataTheme) {
        document.documentElement.setAttribute('data-theme', originalDataTheme)
      } else {
        document.documentElement.removeAttribute('data-theme')
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-white text-gray-900 light">
      {children}
    </div>
  )
}
