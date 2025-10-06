"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getUserWithRole, signInWithDiscord, signInWithGoogle, signOut } from './supabase-auth'
import type { SupabaseUser, SupabaseSession } from './supabase-auth'

// Helper function to create user in database from Supabase Auth user
async function createUserFromSupabaseAuth(supabaseUser: any) {
  try {
    // Extract user data from Supabase Auth user object
    const userData = {
      supabaseAuthId: supabaseUser.id,
      email: supabaseUser.email,
      name: supabaseUser.user_metadata?.full_name ||
            supabaseUser.user_metadata?.name ||
            supabaseUser.raw_user_meta_data?.full_name ||
            supabaseUser.raw_user_meta_data?.name,
      image: supabaseUser.user_metadata?.avatar_url ||
             supabaseUser.user_metadata?.picture ||
             supabaseUser.raw_user_meta_data?.avatar_url ||
             supabaseUser.raw_user_meta_data?.picture,
      verified: supabaseUser.email_confirmed_at ? true : false,
      role: 'CLIPPER' // Default role for new users
    }

    console.log('📝 Creating user from Supabase Auth:', userData)

    // Create user in database
    const response = await fetch('/api/auth/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'INSERT',
        table: 'users',
        record: supabaseUser
      })
    })

    if (response.ok) {
      console.log('✅ User created successfully via webhook')
    } else {
      console.error('❌ Failed to create user via webhook:', response.status)
    }
  } catch (error) {
    console.error('❌ Error creating user from Supabase Auth:', error)
    throw error
  }
}

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

            // If user doesn't exist in database but we have a session, create them
            if (session.user && !enhancedUser) {
              console.log('🔄 Creating user in database...')
              try {
                await createUserFromSupabaseAuth(session.user)
              } catch (createError) {
                console.error('Failed to create user in database:', createError)
              }
            }

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
