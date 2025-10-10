"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getUserWithRole, signInWithDiscord, signInWithGoogle, signOut } from './supabase-browser'
import type { SupabaseUser, SupabaseSession } from './supabase-browser'

// Helper function to create user in database from Supabase Auth user
// This is now handled automatically in the server-side auth functions

interface AuthContextType {
  user: SupabaseUser | null
  session: SupabaseSession | null
  loading: boolean
  signIn: (provider: 'discord' | 'google') => Promise<{ error?: any }>
  logout: () => Promise<{ error?: any }>
  refreshUser: () => Promise<void>
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
        
        // Check for OAuth callback parameters in URL
        const urlParams = new URLSearchParams(window.location.search)
        const urlHash = window.location.hash
        console.log('🔍 URL check:', {
          hasSearchParams: urlParams.toString().length > 0,
          hasHash: urlHash.length > 0,
          searchParams: urlParams.toString(),
          hash: urlHash
        })
        
        // Check what cookies are available
        const allCookies = document.cookie
        console.log('🍪 Available cookies:', allCookies ? 'present' : 'none')
        console.log('🍪 Supabase cookies:', allCookies.includes('sb-') ? 'found' : 'missing')
        
        // If we have OAuth callback parameters, wait a bit for Supabase to process them
        if (urlHash.includes('access_token') || urlParams.has('code')) {
          console.log('🔄 OAuth callback detected, waiting for Supabase to process...')
          await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
        }
        
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

            // Fetch user role from database to enhance session
            try {
              const response = await fetch('/api/user/profile', {
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json'
                }
              })
              
              if (response.ok) {
                const userData = await response.json()
                console.log('✅ Enhanced session with database data:', { 
                  role: userData.role, 
                  name: userData.name,
                  email: userData.email,
                  hasRole: !!userData.role,
                  roleValue: userData.role
                })
                
                // Enhance the user object with database data
                const enhancedUser = {
                  ...session.user,
                  role: userData.role,
                  verified: userData.verified,
                  name: userData.name,
                  image: userData.image
                } as SupabaseUser
                
                const enhancedSession = {
                  ...session,
                  user: enhancedUser
                } as SupabaseSession
                
                setUser(enhancedUser)
                setSession(enhancedSession)
              } else {
                console.warn('Could not fetch user profile, using basic session')
                setUser(session.user as SupabaseUser)
                setSession(session as SupabaseSession)
              }
            } catch (error) {
              console.warn('Error fetching user profile:', error)
              setUser(session.user as SupabaseUser)
              setSession(session as SupabaseSession)
            }

            // Debug: Send session info to server for comparison
            try {
              fetch('/api/debug/frontend-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  hasSession: true,
                  sessionData: session
                })
              }).catch(e => console.log('Debug endpoint error:', e.message))
            } catch (e) {
              // Ignore debug errors
            }
          } else {
            console.log('❌ No initial session found or error:', error?.message)
            
            // Debug: Send no-session info to server
            try {
              fetch('/api/debug/frontend-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  hasSession: false,
                  sessionData: null
                })
              }).catch(e => console.log('Debug endpoint error:', e.message))
            } catch (e) {
              // Ignore debug errors
            }
            
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

            // Always update session state for consistency
            setSession(session as SupabaseSession)
            setUser(session.user as SupabaseUser)
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
      // Force re-render by updating loading state
      setLoading(false)
    } else {
      setLoading(false)
    }
    return { error }
  }

  const refreshUser = async () => {
    try {
      console.log('🔄 Refreshing user data from database...')
      const { data: { session: currentSession }, error } = await supabase.auth.getSession()
      
      if (currentSession?.user && !error) {
        // Fetch fresh user data from our API which includes database profile data
        const response = await fetch('/api/debug/profile-test', {
          headers: {
            'Authorization': `Bearer ${currentSession.access_token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const userData = await response.json()
          if (userData.success && userData.user) {
            // Update the session with fresh database data
            const updatedUser = {
              ...currentSession.user,
              name: userData.user.name,
              image: userData.user.image,
              role: userData.user.role,
              verified: userData.user.verified
            } as SupabaseUser
            
            const updatedSession = {
              ...currentSession,
              user: updatedUser
            } as SupabaseSession
            
            setUser(updatedUser)
            setSession(updatedSession)
            console.log('✅ User data refreshed successfully')
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not refresh user data:', error)
    }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    logout,
    refreshUser
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

