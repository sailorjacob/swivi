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
        const { user: initialUser, error } = await getUserWithRole()

        if (isMounted) {
          if (initialUser && !error) {
            console.log('✅ Initial session found:', initialUser.email)

            // Set session first
            setSession({ user: initialUser } as SupabaseSession)

            // Use session data directly - simplified approach
            console.log('✅ Using session data for user')
            setUser(initialUser)
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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email)

        if (!isMounted) return

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

            // Set session first
            setSession(session as SupabaseSession)

            // Use session data directly - simplified approach
            console.log('✅ Using session data for user')
            setUser(session.user as SupabaseUser)
          } else {
            console.log('❌ No session in auth change')
            setUser(null)
            setSession(null)
          }

          setLoading(false)
        } catch (error) {
          console.error('❌ Error in auth state change:', error)
          setUser(null)
          setSession(null)
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
}
