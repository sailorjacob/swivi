import { NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"

export async function GET() {
  try {
    console.log("🔍 Minimal Profile Debug: Starting...")

    // Step 1: Test user
    console.log("Step 1: Getting user...")
    const { user, error } = await getServerUserWithRole()

    if (!user) {
      console.log("❌ No user found")
      return NextResponse.json({
        error: "No user",
        step: "user_check",
        user_exists: !!user
      }, { status: 401 })
    }
    
    console.log("✅ User found:", { userId: user?.id, email: user?.email })

    if (!user?.id) {
      console.log("❌ Session has no user ID")
      return NextResponse.json({
        error: "User has no user ID",
        step: "user_id_check",
        user: user
      }, { status: 401 })
    }
    
    console.log("✅ Valid user ID found")
    
    // Step 2: Test basic response (without database)
    return NextResponse.json({
      status: "success",
      message: "Session is working correctly",
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name
      },
      session_valid: true
    })
    
  } catch (error) {
    console.error("❌ Minimal profile debug failed:", error)
    
    return NextResponse.json({
      error: "Minimal profile debug failed",
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
