"use client"

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { useEffect } from "react"
import { useSession } from "@/lib/supabase-auth-provider"
import { useRouter } from "next/navigation"

export default function ClippersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    console.log("🔍 Clippers page session check:", { status, session })
    
    if (status === "loading") {
      console.log("⏳ Session loading...")
      return
    }
    
    if (status === "authenticated" && session) {
      console.log("✅ User authenticated, redirecting to campaigns")
      router.push("/clippers/dashboard/campaigns")
    } else {
      console.log("❌ User not authenticated, redirecting to signup")
      router.push("/clippers/signup")
    }
  }, [status, session, router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
      </div>
    </div>
  )
} 