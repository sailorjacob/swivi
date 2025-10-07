import { createClient } from '@supabase/supabase-js'
import type { User, Session } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Clean Supabase Auth client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: false
  }
})

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

// Get user with database-enhanced data (for client-side use)
export const getUserWithRole = async (): Promise<{ user: SupabaseUser | null; error: any }> => {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (user && !error) {
    // Fetch enhanced data from our API
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const userData = await response.json()
        // Merge Supabase Auth user with database data
        return {
          user: {
            ...user,
            ...userData,
            // Ensure we keep the auth data as primary
            id: user.id,
            email: user.email,
            user_metadata: user.user_metadata,
            email_confirmed_at: user.email_confirmed_at
          } as SupabaseUser,
          error: null
        }
      }
    } catch (fetchError) {
      console.warn('Could not fetch enhanced user data:', fetchError)
    }

    // Fallback to basic user data
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
