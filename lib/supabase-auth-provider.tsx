"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getUserWithRole, signInWithDiscord, signInWithGoogle, signOut } from './supabase-auth'
import type { SupabaseUser, SupabaseSession } from './supabase-auth'

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
    // Get initial session
    const getInitialSession = async () => {
      const { session } = await getUserWithRole()
      setSession(session)
      setUser(session?.user || null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)

        if (session?.user) {
          // Get enhanced user data with role
          const { user: enhancedUser } = await getUserWithRole()
          setUser(enhancedUser)
        } else {
          setUser(null)
        }

        setSession(session as SupabaseSession)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
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
  const { user, session, loading } = useAuth()

  return {
    data: session ? { user } : null,
    status: loading ? 'loading' : session ? 'authenticated' : 'unauthenticated'
  }
}
