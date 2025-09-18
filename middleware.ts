import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Demo mode: Allow access to all clipper pages in development
  const isDemoMode = process.env.NODE_ENV === "development"
  
  if (isDemoMode) {
    return NextResponse.next()
  }
  
  // In production, you would add authentication logic here
  // For now, just allow access
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/clippers/dashboard/:path*",
  ],
}
