import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
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
export const getServerUserWithRole = async (request?: NextRequest): Promise<{ user: SupabaseUser | null; error: any }> => {
  try {
    let supabase

    if (request) {
      // Create a server client with request context for API routes
      const cookieStore = {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // In API routes, we can't set cookies, but this is just for reading
        },
        remove(name: string, options: any) {
          // In API routes, we can't remove cookies, but this is just for reading
        },
      }

      supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: cookieStore,
      })
    } else {
      // Use the standard server client for non-request contexts
      supabase = createSupabaseServerClient()
    }

    const { data: { user }, error } = await supabase.auth.getUser()

    if (user && !error) {
      try {
        // Check if user exists in our database, create if not
        await ensureUserExists(user)

        // Try to fetch from database - handle connection failures gracefully
        try {
          const userData = await prisma.user.findUnique({
            where: { supabaseAuthId: user.id },
            select: {
              id: true,
              role: true,
              verified: true,
              name: true,
              image: true,
              email: true
            }
          })

          if (userData) {
            ;(user as SupabaseUser).role = userData.role || 'CLIPPER'
            ;(user as SupabaseUser).verified = userData.verified || false
            // Update user object with database info
            if (userData.name) user.user_metadata = { ...user.user_metadata, full_name: userData.name }
            if (userData.image) user.user_metadata = { ...user.user_metadata, avatar_url: userData.image }
            if (userData.email) user.email = userData.email
          } else {
            // No database record found - use OAuth data only
            ;(user as SupabaseUser).role = 'CLIPPER'
            console.log('ℹ️ No database record found for user - using OAuth data only')
          }
        } catch (dbError) {
          if (dbError.message?.includes('database') || dbError.message?.includes('connection') || dbError.message?.includes("Can't reach database server")) {
            console.warn('Database unavailable - using OAuth data only')
            ;(user as SupabaseUser).role = 'CLIPPER'
          } else {
            console.warn('Could not fetch user role:', dbError)
            ;(user as SupabaseUser).role = 'CLIPPER'
          }
        }
      } catch (dbError) {
        console.warn('Could not process user data:', dbError)
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

        // Try to fetch from database - handle connection failures gracefully
        try {
          const userData = await prisma.user.findUnique({
            where: { supabaseAuthId: user.id },
            select: {
              id: true,
              role: true,
              verified: true,
              name: true,
              image: true,
              email: true
            }
          })

          if (userData) {
            ;(user as SupabaseUser).role = userData.role || 'CLIPPER'
            ;(user as SupabaseUser).verified = userData.verified || false
            // Update user object with database info
            if (userData.name) user.user_metadata = { ...user.user_metadata, full_name: userData.name }
            if (userData.image) user.user_metadata = { ...user.user_metadata, avatar_url: userData.image }
            if (userData.email) user.email = userData.email
          } else {
            // No database record found - use OAuth data only
            ;(user as SupabaseUser).role = 'CLIPPER'
            console.log('ℹ️ No database record found for user - using OAuth data only')
          }
        } catch (dbError) {
          if (dbError.message?.includes('database') || dbError.message?.includes('connection') || dbError.message?.includes("Can't reach database server")) {
            console.warn('Database unavailable - using OAuth data only')
            ;(user as SupabaseUser).role = 'CLIPPER'
          } else {
            console.warn('Could not fetch user role:', dbError)
            ;(user as SupabaseUser).role = 'CLIPPER'
          }
        }
      } catch (dbError) {
        console.warn('Could not process user data:', dbError)
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
    // First, try to find user by supabaseAuthId (for users who logged in before)
    let existingUser
    try {
      existingUser = await prisma.user.findUnique({
        where: { supabaseAuthId: supabaseUser.id },
        select: { id: true, name: true, image: true, email: true, supabaseAuthId: true }
      })
    } catch (dbError) {
      if (dbError.message?.includes('database') || dbError.message?.includes('connection') || dbError.message?.includes("Can't reach database server")) {
        console.log('⚠️ Database unavailable for user lookup - allowing authentication to continue')
        return
      }
      throw dbError
    }

    if (existingUser) {
      // User exists with supabaseAuthId, update their info if needed
      await updateExistingUser(supabaseUser, existingUser)
      return
    }

    // If not found by supabaseAuthId, try to find by email (for existing users without supabaseAuthId)
    if (supabaseUser.email) {
      try {
        existingUser = await prisma.user.findUnique({
          where: { email: supabaseUser.email },
          select: { id: true, name: true, image: true, email: true, supabaseAuthId: true }
        })
      } catch (dbError) {
        if (dbError.message?.includes('database') || dbError.message?.includes('connection') || dbError.message?.includes("Can't reach database server")) {
          console.log('⚠️ Database unavailable for email lookup - allowing authentication to continue')
          return
        }
        throw dbError
      }

      if (existingUser) {
        // Found user by email, update them with supabaseAuthId
        try {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { supabaseAuthId: supabaseUser.id }
          })
          console.log('✅ Linked existing user with supabaseAuthId:', existingUser.id)
          await updateExistingUser(supabaseUser, existingUser)
          return
        } catch (dbError) {
          if (dbError.message?.includes('database') || dbError.message?.includes('connection') || dbError.message?.includes("Can't reach database server")) {
            console.log('⚠️ Database unavailable for user linking - allowing authentication to continue')
            return
          }
          throw dbError
        }
      }
    }

    // User doesn't exist, create new one
    await createNewUser(supabaseUser)
  } catch (error) {
    console.error('Error in ensureUserExists:', error)
    // Don't fail authentication if database is unavailable
    if (error.message?.includes('database') || error.message?.includes('connection') || error.message?.includes("Can't reach database server")) {
      console.log('⚠️ Database unavailable - allowing authentication to continue')
    } else {
      // For other errors, still try to continue but log them
      console.warn('Non-database error in ensureUserExists:', error.message)
    }
  }
}

// Helper to update existing user info
async function updateExistingUser(supabaseUser: any, existingUser: any) {
  try {
    const updateData: any = {}

    // Update email if changed
    if (supabaseUser.email && supabaseUser.email !== existingUser.email) {
      updateData.email = supabaseUser.email
    }

    // Extract and update name
    const name = supabaseUser.user_metadata?.full_name ||
                 supabaseUser.user_metadata?.name ||
                 supabaseUser.raw_user_meta_data?.full_name ||
                 supabaseUser.raw_user_meta_data?.name ||
                 supabaseUser.email?.split('@')[0] || // Fallback to email prefix
                 'New User' // Final fallback
    if (name && name !== existingUser.name) {
      updateData.name = name
    }

    // Extract and update image
    const image = supabaseUser.user_metadata?.avatar_url ||
                  supabaseUser.user_metadata?.picture ||
                  supabaseUser.raw_user_meta_data?.avatar_url ||
                  supabaseUser.raw_user_meta_data?.picture
    if (image && image !== existingUser.image) {
      updateData.image = image
    }

    // Update verification status
    if (supabaseUser.email_confirmed_at && !existingUser.verified) {
      updateData.verified = true
    }

    if (Object.keys(updateData).length > 0) {
      try {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: updateData
        })
        console.log('✅ Updated existing user info for:', existingUser.email)
      } catch (dbError) {
        if (dbError.message?.includes('database') || dbError.message?.includes('connection') || dbError.message?.includes("Can't reach database server")) {
          console.log('⚠️ Database unavailable for user update - allowing authentication to continue')
          return
        }
        throw dbError
      }
    }
  } catch (error) {
    console.error('Error updating existing user:', error)
    if (error.message?.includes('database') || error.message?.includes('connection') || error.message?.includes("Can't reach database server")) {
      console.log('⚠️ Database unavailable for user update - allowing authentication to continue')
    }
  }
}

// Helper to create new user
async function createNewUser(supabaseUser: any) {
  try {
    const name = supabaseUser.user_metadata?.full_name ||
                 supabaseUser.user_metadata?.name ||
                 supabaseUser.raw_user_meta_data?.full_name ||
                 supabaseUser.raw_user_meta_data?.name ||
                 supabaseUser.email?.split('@')[0] || // Fallback to email prefix
                 'New User' // Final fallback

    const image = supabaseUser.user_metadata?.avatar_url ||
                  supabaseUser.user_metadata?.picture ||
                  supabaseUser.raw_user_meta_data?.avatar_url ||
                  supabaseUser.raw_user_meta_data?.picture

    const userData = {
      supabaseAuthId: supabaseUser.id,
      email: supabaseUser.email,
      name: name,
      image: image || null,
      verified: supabaseUser.email_confirmed_at ? true : false,
      role: 'CLIPPER' // Default role for new users
    }

    console.log('Creating new user in database:', { email: userData.email, name: userData.name })

    try {
      const newUser = await prisma.user.create({
        data: userData
      })
      console.log('✅ User created successfully:', newUser.id)
    } catch (dbError) {
      if (dbError.message?.includes('database') || dbError.message?.includes('connection') || dbError.message?.includes("Can't reach database server")) {
        console.log('⚠️ Database unavailable for user creation - allowing authentication to continue')
        return
      }
      throw dbError
    }
  } catch (error) {
    console.error('Error creating new user:', error)
    if (error.message?.includes('database') || error.message?.includes('connection') || error.message?.includes("Can't reach database server")) {
      console.log('⚠️ Database unavailable for user creation - allowing authentication to continue')
    }
  }
}