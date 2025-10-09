"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-auth'
import { useSession } from '@/lib/supabase-auth-provider'

export function AuthDebug() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const { data: session, status } = useSession()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check Supabase session directly
        const { data: { session: supabaseSession }, error: sessionError } = await supabase.auth.getSession()
        
        // Check Supabase user directly
        const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser()

        // Get cookies
        const cookies = document.cookie

        setDebugInfo({
          // From useSession hook
          hookSession: !!session,
          hookStatus: status,
          hookUserId: session?.user?.id,
          hookUserEmail: session?.user?.email,
          
          // Direct from Supabase
          supabaseSession: !!supabaseSession,
          supabaseUser: !!supabaseUser,
          supabaseUserId: supabaseUser?.id,
          supabaseUserEmail: supabaseUser?.email,
          supabaseAccessToken: !!supabaseSession?.access_token,
          
          // Errors
          sessionError: sessionError?.message,
          userError: userError?.message,
          
          // Cookies
          hasCookies: !!cookies,
          hasSupabaseCookies: cookies.includes('sb-'),
          
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        console.error('Auth debug error:', error)
        setDebugInfo({ error: error.message })
      }
    }

    checkAuth()
    
    // Check every 5 seconds
    const interval = setInterval(checkAuth, 5000)
    return () => clearInterval(interval)
  }, [session, status])

  // Always show debug panel when there are auth issues (401 errors)
  // Hide only if we have a working session AND no errors
  const hasAuthIssues = debugInfo.sessionError || debugInfo.userError || !debugInfo.supabaseSession
  
  if (process.env.NODE_ENV === 'production' && session && !hasAuthIssues) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs max-w-md z-50">
      <div className="font-bold mb-2">🔍 Auth Debug</div>
      <pre className="whitespace-pre-wrap text-xs">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  )
}
