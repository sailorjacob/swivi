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

  // For API routes, let them handle their own authentication
  // The middleware doesn't need to pre-authenticate API routes since they handle auth internally
  if (pathname.startsWith('/api/')) {
    console.log(`🔄 API route detected: ${pathname} - letting route handle authentication`)
    console.log(`🔍 Request headers:`, Object.fromEntries(req.headers.entries()))
    console.log(`🍪 Request cookies:`, req.cookies)
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
