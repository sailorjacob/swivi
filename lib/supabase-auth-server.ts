import { createServerClient } from '@supabase/ssr'
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
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch (error) {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
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

    // Check if user already exists by supabaseAuthId
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('id, name, image, email')
      .eq('supabaseAuthId', supabaseUser.id)
      .maybeSingle()

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Error checking existing user:', selectError)
      return
    }

    if (existingUser) {
      // User exists, but let's update their info if needed
      const updateData: any = {}
      if (supabaseUser.email && supabaseUser.email !== existingUser.email) {
        updateData.email = supabaseUser.email
      }

      const name = supabaseUser.user_metadata?.full_name ||
                   supabaseUser.user_metadata?.name ||
                   supabaseUser.raw_user_meta_data?.full_name ||
                   supabaseUser.raw_user_meta_data?.name
      if (name && name !== existingUser.name) {
        updateData.name = name
      }

      const image = supabaseUser.user_metadata?.avatar_url ||
                    supabaseUser.user_metadata?.picture ||
                    supabaseUser.raw_user_meta_data?.avatar_url ||
                    supabaseUser.raw_user_meta_data?.picture
      if (image && image !== existingUser.image) {
        updateData.image = image
      }

      if (Object.keys(updateData).length > 0) {
        await supabase
          .from('users')
          .update(updateData)
          .eq('supabaseAuthId', supabaseUser.id)
        console.log('✅ Updated existing user info')
      }
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

    console.log('Creating new user in database:', { email: userData.email, name: userData.name })

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