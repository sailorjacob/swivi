import { createClient } from '@supabase/supabase-js'
import type { User, Session, NextRequest } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: false
  }
})

// Types for compatibility with NextAuth.js patterns
export interface SupabaseUser extends User {
  role?: string
  verified?: boolean
}

export interface SupabaseSession extends Session {
  user: SupabaseUser
}

// Auth helper functions
export const signInWithDiscord = async () => {
  // Use environment-aware redirect URL
  const redirectTo = process.env.NODE_ENV === 'production'
    ? `https://www.swivimedia.com/clippers/dashboard`
    : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/clippers/dashboard`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo
    }
  })
  return { data, error }
}

export const signInWithGoogle = async () => {
  // Use environment-aware redirect URL
  const redirectTo = process.env.NODE_ENV === 'production'
    ? `https://www.swivimedia.com/clippers/dashboard`
    : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/clippers/dashboard`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo
    }
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getUser = async (): Promise<{ user: SupabaseUser | null; error: any }> => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user: user as SupabaseUser, error }
}

export const getSession = async (): Promise<{ session: SupabaseSession | null; error: any }> => {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session: session as SupabaseSession, error }
}

// Enhanced user data with role from your database
// Note: Client-side role fetching is now handled by API routes
// This function just returns the basic user data
export const getUserWithRole = async (): Promise<{ user: SupabaseUser | null; error: any }> => {
  const { user, error } = await getUser()

  if (user && !error) {
    // Set default role - API routes will provide enhanced data
    user.role = 'CLIPPER'
    user.verified = user.email_confirmed_at ? true : false
  }

  return { user, error }
}
