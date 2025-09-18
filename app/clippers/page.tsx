"use client"

import { useEffect } from "react"

export default function ClippersPage() {
  useEffect(() => {
    // Redirect to the new simplified landing page
    window.location.href = "/clippers/landing"
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  )
}