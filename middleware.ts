import { NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Middleware for Supabase Auth - handles redirects and basic checks
export default async function middleware(req) {
  const { pathname, searchParams } = req.nextUrl

  // Log middleware checks for debugging
  console.log(`🛡️ Middleware check for: ${pathname}`)

  // Check if this is an OAuth callback in progress (Supabase Auth)
  const isOAuthCallback = searchParams.has('code') ||
                         searchParams.has('state') ||
                         req.headers.get('referer')?.includes('/auth/v1/callback')

  if (isOAuthCallback) {
    console.log(`🔄 OAuth callback detected, allowing access temporarily`)
    return NextResponse.next()
  }

  // Check if this is an API route that needs authentication
  if (pathname.startsWith('/api/')) {
    try {
      // Create a server client to check authentication
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // In middleware, we can't set cookies, but this is just for reading
          },
          remove(name: string, options: any) {
            // In middleware, we can't remove cookies, but this is just for reading
          },
        },
      })

      // Check if user is authenticated
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        console.log(`❌ API authentication failed for: ${pathname}`)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      console.log(`✅ API authenticated for user: ${session.user.email}`)
    } catch (error) {
      console.error('Middleware auth check error:', error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  }

  console.log(`✅ Allowing access to: ${pathname}`)
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Only match specific paths to avoid conflicts during migration
    "/admin/:path*",
    "/clippers/dashboard/:path*",
    "/api/:path*",
  ],
}
