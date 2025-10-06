import { createServerClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { SupabaseUser, SupabaseSession } from './supabase-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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

// Enhanced server-side user data with role from your database
export const getServerUserWithRole = async (): Promise<{ user: SupabaseUser | null; error: any }> => {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (user && !error) {
      try {
        // Fetch additional user data from your users table using supabaseAuthId
        const { data: userData } = await supabase
          .from('users')
          .select('id, role, verified, name, image, email')
          .eq('supabaseAuthId', user.id)
          .single()

        if (userData) {
          ;(user as SupabaseUser).role = userData.role || 'CLIPPER'
          ;(user as SupabaseUser).verified = userData.verified || false
          // Update user object with database info
          if (userData.name) user.user_metadata = { ...user.user_metadata, full_name: userData.name }
          if (userData.image) user.user_metadata = { ...user.user_metadata, avatar_url: userData.image }
          if (userData.email) user.email = userData.email
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