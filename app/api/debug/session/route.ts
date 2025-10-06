import { NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"

export async function GET() {
  try {
    console.log("🔍 Debug: Checking user...")

    const { user, error } = await getServerUserWithRole()

    if (!user) {
      return NextResponse.json({
        error: "No user found",
        status: "no_user",
        user_exists: !!user,
        timestamp: new Date().toISOString()
      }, { status: 401 })
    }
    
    console.log("✅ User found:", user?.id)
    
    return NextResponse.json({
      status: "success",
      user: {
        userId: user?.id,
        email: user?.email,
        name: user?.user_metadata?.full_name,
        role: user?.role
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
