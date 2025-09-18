import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Demo mode: Allow access in development
        if (process.env.NODE_ENV === "development" && req.nextUrl.pathname.includes("clippers-demo")) {
          return true
        }
        
        // Check if user is authenticated for protected routes
        return !!token
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
