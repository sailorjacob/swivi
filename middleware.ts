import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    
    // Log middleware checks for debugging
    console.log(`🛡️ Middleware check for: ${pathname}`)
    
    // Add any additional middleware logic here
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
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
