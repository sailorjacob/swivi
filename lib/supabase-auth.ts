import { createClient, createServerClient } from '@supabase/supabase-js'
import type { User, Session, NextRequest } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Server-side Supabase client for API routes
export const createSupabaseServerClient = () => {
  const cookieStore = cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: any) {
        cookieStore.set({ name, value: '', ...options })
      },
    },
  })
}

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
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo: `https://www.swivimedia.com/clippers/dashboard`
    }
  })
  return { data, error }
}

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `https://www.swivimedia.com/clippers/dashboard`
    }
  })
  return { data, error }
}

// Alternative sign-in functions that always redirect to production URL
// Use these for production deployments
export const signInWithDiscordProduction = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo: `https://www.swivimedia.com/clippers/dashboard`
    }
  })
  return { data, error }
}

export const signInWithGoogleProduction = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `https://www.swivimedia.com/clippers/dashboard`
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

// Server-side session helper for API routes
export const getServerSession = async (): Promise<{ session: SupabaseSession | null; error: any }> => {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session: session as SupabaseSession, error }
  } catch (error) {
    return { session: null, error }
  }
}

// Enhanced user data with role from your database
export const getUserWithRole = async (): Promise<{ user: SupabaseUser | null; error: any }> => {
  const { user, error } = await getUser()

  if (user && !error) {
    try {
      // Fetch additional user data from your users table
      const { data: userData } = await supabase
        .from('users')
        .select('role, verified')
        .eq('id', user.id)
        .single()

      if (userData) {
        user.role = userData.role || 'CLIPPER'
        user.verified = userData.verified || false
      }
    } catch (dbError) {
      console.warn('Could not fetch user role:', dbError)
      user.role = 'CLIPPER'
    }
  }

  return { user, error }
}

// Enhanced server-side user data with role from your database
export const getServerUserWithRole = async (): Promise<{ user: SupabaseUser | null; error: any }> => {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (user && !error) {
      try {
        // Fetch additional user data from your users table
        const { data: userData } = await supabase
          .from('users')
          .select('role, verified')
          .eq('id', user.id)
          .single()

        if (userData) {
          (user as SupabaseUser).role = userData.role || 'CLIPPER'
          ;(user as SupabaseUser).verified = userData.verified || false
        }
      } catch (dbError) {
        console.warn('Could not fetch user role:', dbError)
        ;(user as SupabaseUser).role = 'CLIPPER'
      }
    }

    return { user: user as SupabaseUser, error }
  } catch (error) {
    return { user: null, error }
  }
}
