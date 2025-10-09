import { createBrowserClient } from '@supabase/ssr'
import type { User, Session } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client with proper SSR cookie handling
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Enhanced user type with our database fields
export interface SupabaseUser extends User {
  role?: string
  verified?: boolean
  bio?: string
  website?: string
  walletAddress?: string
  paypalEmail?: string
  totalEarnings?: number
  totalViews?: number
}

export interface SupabaseSession extends Session {
  user: SupabaseUser
}

// Clean OAuth login functions
export const signInWithDiscord = async () => {
  const redirectTo = process.env.NODE_ENV === 'production'
    ? `https://www.swivimedia.com/clippers/dashboard`
    : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/clippers/dashboard`

  return supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: { redirectTo }
  })
}

export const signInWithGoogle = async () => {
  const redirectTo = process.env.NODE_ENV === 'production'
    ? `https://www.swivimedia.com/clippers/dashboard`
    : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/clippers/dashboard`

  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo }
  })
}

export const signOut = async () => {
  return supabase.auth.signOut()
}

// Basic auth functions
export const getUser = async () => {
  return supabase.auth.getUser()
}

export const getSession = async () => {
  return supabase.auth.getSession()
}

// Get user with basic role assignment (simplified)
export const getUserWithRole = async (): Promise<{ user: SupabaseUser | null; error: any }> => {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (user && !error) {
    // Return user with basic role assignment
    return {
      user: {
        ...user,
        role: 'CLIPPER',
        verified: user.email_confirmed_at ? true : false
      } as SupabaseUser,
      error: null
    }
  }

  return { user: null, error }
}

// Helper function for authenticated API calls
export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  console.log('🔍 authenticatedFetch session check:', {
    hasSession: !!session,
    hasAccessToken: !!session?.access_token,
    error: error?.message,
    url
  })
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Add Authorization header if we have a session
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
    console.log('✅ Added Authorization header for', url)
  } else {
    console.log('❌ No access token available for', url)
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include cookies
  })
}
