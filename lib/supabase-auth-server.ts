import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

// Create Supabase client with service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * Server-side authentication helper for API routes
 * Returns authenticated user or throws error
 */
export async function getAuthenticatedUser(request: NextRequest) {
  // Get authorization header
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    throw new Error('No authorization header provided')
  }

  // Extract JWT token from Bearer header
  const token = authHeader.replace('Bearer ', '')
  if (!token) {
    throw new Error('No token provided')
  }

  // Verify the JWT token with Supabase
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    throw new Error('Authentication failed: Invalid or expired token')
  }

  return user
}

/**
 * Check if user is admin
 */
export async function requireAdmin(request: NextRequest) {
  const user = await getAuthenticatedUser(request)

  // Import prisma here to avoid circular imports
  const { prisma } = await import('@/lib/prisma')

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, role: true }
  })

  if (!dbUser || dbUser.role !== "ADMIN") {
    throw new Error(`Admin access required. Current role: ${dbUser?.role || "unknown"}`)
  }

  return { user, dbUser }
}
