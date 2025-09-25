import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname, searchParams } = req.nextUrl
    
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
        
        // Allow access to protected routes only if authenticated
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
    "/api/clippers/:path*",
  ],
}
