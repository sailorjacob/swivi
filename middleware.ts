import { NextResponse } from "next/server"

// Simplified middleware - just handle OAuth callbacks
export default async function middleware(req) {
  const { pathname, searchParams } = req.nextUrl

  // Only handle OAuth callbacks - let everything else through
  const isOAuthCallback = searchParams.has('code') ||
                         searchParams.has('state') ||
                         pathname.includes('/auth/v1/callback') ||
                         req.headers.get('referer')?.includes('/auth/v1/callback')

  if (isOAuthCallback) {
    console.log(`🔄 OAuth callback detected for: ${pathname}`)
    return NextResponse.next()
  }

  // Let everything else through - authentication handled by pages/components
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Only match OAuth callbacks to avoid interfering with auth flow
    "/auth/v1/callback",
    "/clippers/signup",
  ],
}
