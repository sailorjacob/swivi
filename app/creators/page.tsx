"use client"

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import { useSession } from "@/lib/supabase-auth-provider"
import { useRouter } from "next/navigation"

export default function ClippersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    console.log("🔍 Clippers page session check:", { status, session })

    if (status === "loading") {
      console.log("⏳ Session loading...")
      return
    }

    if (isRedirecting) {
      return // Prevent multiple redirects
    }

    if (status === "authenticated" && session?.user) {
      console.log("✅ User authenticated, redirecting to campaigns")
      setIsRedirecting(true)
      router.replace("/creators/dashboard/campaigns")
    } else {
      console.log("❌ User not authenticated, redirecting to login")
      setIsRedirecting(true)
      router.replace("/creators/login")
    }
  }, [status, session, router, isRedirecting])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
} 