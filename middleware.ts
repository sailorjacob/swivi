import { NextResponse } from "next/server"

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
                         pathname.includes('/auth/v1/callback') ||
                         req.headers.get('referer')?.includes('/auth/v1/callback')

  if (isOAuthCallback) {
    console.log(`🔄 OAuth callback detected, allowing access temporarily`)
    return NextResponse.next()
  }

  // Check for Supabase auth cookies
  const accessToken = req.cookies.get('sb-access-token')?.value
  const refreshToken = req.cookies.get('sb-refresh-token')?.value
  const hasAuthCookies = accessToken && refreshToken

  // Protected routes that require authentication
  const protectedPaths = [
    '/admin',
    '/clippers/dashboard',
    '/api/user',
    '/api/clippers',
    '/api/admin'
  ]

  const isProtectedPath = protectedPaths.some(path =>
    pathname.startsWith(path) || pathname.includes(path)
  )

  if (isProtectedPath && !hasAuthCookies) {
    console.log(`🚨 Protected route ${pathname} accessed without authentication - redirecting to login`)

    // For API routes, return 401 instead of redirect
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For page routes, redirect to login
    const loginUrl = new URL('/clippers/signup', req.url)
    return NextResponse.redirect(loginUrl)
  }

  // For API routes, let them handle their own authentication
  if (pathname.startsWith('/api/')) {
    console.log(`🔄 API route detected: ${pathname} - letting route handle authentication`)
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
