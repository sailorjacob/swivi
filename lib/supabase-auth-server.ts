import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { SupabaseUser, SupabaseSession } from './supabase-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Server-side Supabase client for API routes
export const createSupabaseServerClient = () => {
  const cookieStore = cookies()

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      getSession: async () => {
        const accessToken = cookieStore.get('sb-access-token')?.value
        const refreshToken = cookieStore.get('sb-refresh-token')?.value
        if (accessToken && refreshToken) {
          return {
            data: {
              session: {
                access_token: accessToken,
                refresh_token: refreshToken,
                user: null, // We'll get this from getUser()
              }
            },
            error: null
          }
        }
        return { data: { session: null }, error: null }
      },
      setSession: async (session) => {
        if (session) {
          cookieStore.set('sb-access-token', session.access_token, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
          })
          cookieStore.set('sb-refresh-token', session.refresh_token, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
          })
        } else {
          cookieStore.set('sb-access-token', '', { path: '/', maxAge: 0 })
          cookieStore.set('sb-refresh-token', '', { path: '/', maxAge: 0 })
        }
      }
    }
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
        // Check if user exists in our database, create if not
        await ensureUserExists(user)

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

// Get authenticated user from request (for API routes that need request object)
export const getAuthenticatedUser = async (request: NextRequest): Promise<SupabaseUser | null> => {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (user && !error) {
      try {
        // Check if user exists in our database, create if not
        await ensureUserExists(user)

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
      return user as SupabaseUser
    }
    return null
  } catch (error) {
    console.error('Error getting authenticated user:', error)
    return null
  }
}

// Helper function to ensure user exists in our database
async function ensureUserExists(supabaseUser: any) {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('supabaseAuthId', supabaseUser.id)
      .single()

    if (existingUser) {
      return // User already exists
    }

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

    console.log('Creating user in database:', userData)

    // Create user in database
    const { error } = await supabase
      .from('users')
      .insert(userData)

    if (error) {
      console.error('Error creating user:', error)
    } else {
      console.log('✅ User created successfully')
    }
  } catch (error) {
    console.error('Error in ensureUserExists:', error)
  }
}