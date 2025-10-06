"use client"

import { SupabaseAuthProvider } from "@/lib/supabase-auth-provider"
import { ReactNode } from "react"

export function AuthProvider({ children }: { children: ReactNode }) {
  return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>
}

// Re-export for backward compatibility
export { useAuth, useSession } from "@/lib/supabase-auth-provider" 