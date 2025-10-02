import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname, searchParams } = req.nextUrl
    const token = req.nextauth?.token

    // Log middleware checks for debugging
    console.log(`🛡️ Middleware check for: ${pathname}`)

    // Check if this is an OAuth callback in progress
    const isOAuthCallback = searchParams.has('callbackUrl') ||
                           searchParams.has('code') ||
                           searchParams.has('state') ||
                           req.headers.get('referer')?.includes('/api/auth/callback')

    if (isOAuthCallback) {
      console.log(`🔄 OAuth callback detected, allowing access temporarily`)
      return NextResponse.next()
    }

    // Check admin page routes (but not API routes)
    if (pathname.startsWith('/admin') && !pathname.startsWith('/api/')) {
      if (!token) {
        console.log(`🚫 Admin route access denied - not authenticated: ${pathname}`)
        return NextResponse.redirect(new URL('/clippers/login?error=AccessDenied', req.url))
      }

      if (token.role !== 'ADMIN') {
        console.log(`🚫 Admin route access denied - insufficient role: ${pathname} (role: ${token.role})`)
        return NextResponse.redirect(new URL('/clippers/dashboard?error=AdminAccessRequired', req.url))
      }

      console.log(`✅ Admin route access granted: ${pathname}`)
      return NextResponse.next()
    }

    // Add any additional middleware logic here
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname, searchParams } = req.nextUrl

        // Check if this is an OAuth callback in progress
        const isOAuthCallback = searchParams.has('callbackUrl') ||
                               searchParams.has('code') ||
                               searchParams.has('state') ||
                               req.headers.get('referer')?.includes('/api/auth/callback')

        if (isOAuthCallback) {
          console.log(`🔄 OAuth callback in progress for ${pathname}, allowing temporary access`)
          return true
        }

        // Allow access to protected routes only if authenticated (but not API routes)
        if (pathname.startsWith('/api/')) {
          console.log(`🔗 API route - allowing without auth check: ${pathname}`)
          return true
        }

        const isAuthorized = !!token
        console.log(`🔐 Authorization check for ${pathname}: ${isAuthorized ? 'GRANTED' : 'DENIED'}`)

        return isAuthorized
      },
    },
  }
)

export const config = {
  matcher: [
    "/clippers/dashboard/:path*",
    "/admin/:path*",
    // API routes handle their own authentication
    // "/api/clippers/:path*",
    // "/api/admin/:path*",
  ],
}
