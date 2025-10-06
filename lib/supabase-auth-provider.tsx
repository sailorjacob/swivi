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
        const { session: initialSession } = await getUserWithRole()
        if (isMounted) {
          setSession(initialSession)
          setUser(initialSession?.user || null)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)

        if (!isMounted) return

        try {
          if (session?.user) {
            // Get enhanced user data with role
            const { user: enhancedUser } = await getUserWithRole()

            // User creation is now handled automatically in server-side auth functions

            setUser(enhancedUser)
          } else {
            setUser(null)
          }

          setSession(session as SupabaseSession)
          setLoading(false)
        } catch (error) {
          console.error('Error in auth state change:', error)
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

// Compatibility hook for NextAuth.js patterns
export function useSession() {
  try {
    const context = useContext(AuthContext)
    if (context === undefined) {
      // Context not available yet, return loading state
      return {
        data: null,
        status: 'loading' as const
      }
    }

    const { user, session, loading } = context

    return {
      data: session ? { user } : null,
      status: loading ? 'loading' : session ? 'authenticated' : 'unauthenticated'
    }
  } catch (error) {
    // Handle any errors during context access
    console.warn('useSession error:', error)
    return {
      data: null,
      status: 'loading' as const
    }
  }
}
