"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getUserWithRole, signInWithDiscord, signInWithGoogle, signOut } from './supabase-auth'
import type { SupabaseUser, SupabaseSession } from './supabase-auth'

// Helper function to create user in database from Supabase Auth user
// This is now handled automatically in the server-side auth functions

interface AuthContextType {
  user: SupabaseUser | null
  session: SupabaseSession | null
  loading: boolean
  signIn: (provider: 'discord' | 'google') => Promise<{ error?: any }>
  logout: () => Promise<{ error?: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [session, setSession] = useState<SupabaseSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔍 Getting initial session...')
        
        // Check what cookies are available
        const allCookies = document.cookie
        console.log('🍪 Available cookies:', allCookies ? 'present' : 'none')
        console.log('🍪 Supabase cookies:', allCookies.includes('sb-') ? 'found' : 'missing')
        
        // Use the actual Supabase session instead of just user
        const { data: { session }, error } = await supabase.auth.getSession()
        
        console.log('🔍 Session retrieval result:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          hasAccessToken: !!session?.access_token,
          userEmail: session?.user?.email,
          error: error?.message
        })

        if (isMounted) {
          if (session?.user && !error) {
            console.log('✅ Initial session found:', session.user.email)

            // Set the actual session
            setSession(session as SupabaseSession)
            setUser(session.user as SupabaseUser)
          } else {
            console.log('❌ No initial session found or error:', error?.message)
            setSession(null)
            setUser(null)
          }
          setLoading(false)
        }
      } catch (error) {
        console.error('❌ Error getting initial session:', error)
        if (isMounted) {
          setSession(null)
          setUser(null)
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes - simplified to prevent rapid state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email)

        if (!isMounted) return

        // Prevent rapid state changes that cause glitching
        if (loading) {
          console.log('⏳ Still loading, ignoring auth state change')
          return
        }

        try {
          if (event === 'SIGNED_OUT') {
            console.log('🚪 User signed out')
            setUser(null)
            setSession(null)
            setLoading(false)
            return
          }

          if (session?.user) {
            console.log('✅ Valid session found in auth change:', session.user.email)

            // Only update if we don't already have a valid session
            if (!user || user.id !== session.user.id) {
              console.log('🔄 Updating session state for user:', session.user.email)
              setSession(session as SupabaseSession)
              setUser(session.user as SupabaseUser)
            }
          } else {
            console.log('❌ No session in auth change')
            setUser(null)
            setSession(null)
          }

          setLoading(false)
        } catch (error) {
          console.error('❌ Error in auth state change:', error)
          // Don't clear user/session on error - let it be handled by retry logic
          setLoading(false)
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (provider: 'discord' | 'google') => {
    setLoading(true)
    try {
      const { error } = provider === 'discord'
        ? await signInWithDiscord()
        : await signInWithGoogle()

      return { error }
    } catch (error) {
      console.error('Sign in error:', error)
      setLoading(false)
      return { error }
    }
  }

  const logout = async () => {
    setLoading(true)
    const { error } = await signOut()
    if (!error) {
      setUser(null)
      setSession(null)
    }
    setLoading(false)
    return { error }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within a SupabaseAuthProvider')
  }
  return context
}

// Alias for compatibility with dashboard components
export function useSession() {
  const { user, session, loading } = useAuth()
  
  // Debug logging
  console.log('🔍 useSession called:', {
    loading,
    hasSession: !!session,
    hasUser: !!user,
    userId: user?.id,
    email: user?.email
  })
  
  return {
    data: session,
    status: loading ? "loading" : (session ? "authenticated" : "unauthenticated")
  }
}

