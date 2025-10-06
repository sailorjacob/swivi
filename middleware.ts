import { NextResponse } from "next/server"

// Middleware for Supabase Auth - handles redirects and basic checks
export default function middleware(req) {
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

  // For now, let API routes and pages handle their own authentication
  // This prevents NextAuth.js conflicts while we migrate to Supabase Auth
  console.log(`✅ Allowing access to: ${pathname}`)
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Only match specific paths to avoid conflicts during migration
    "/admin/:path*",
    "/clippers/dashboard/:path*",
  ],
}
