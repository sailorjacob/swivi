import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    console.log("🔍 Debug: Checking session...")
    
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({
        error: "No session found",
        status: "no_session",
        authOptions: !!authOptions,
        timestamp: new Date().toISOString()
      }, { status: 401 })
    }
    
    console.log("✅ Session found:", session.user?.id)
    
    return NextResponse.json({
      status: "success",
      session: {
        userId: session.user?.id,
        email: session.user?.email,
        name: session.user?.name,
        hasAccessToken: !!session.accessToken
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error("❌ Session debug failed:", error)
    
    return NextResponse.json({
      error: "Session check failed",
      details: error instanceof Error ? error.message : String(error),
      status: "session_error"
    }, { status: 500 })
  }
}
