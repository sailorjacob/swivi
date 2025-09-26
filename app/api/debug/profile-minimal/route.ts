import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    console.log("🔍 Minimal Profile Debug: Starting...")
    
    // Step 1: Test session
    console.log("Step 1: Getting session...")
    const session = await getServerSession(authOptions)
    
    if (!session) {
      console.log("❌ No session found")
      return NextResponse.json({ 
        error: "No session",
        step: "session_check",
        authOptions_exists: !!authOptions
      }, { status: 401 })
    }
    
    console.log("✅ Session found:", { userId: session.user?.id, email: session.user?.email })
    
    if (!session.user?.id) {
      console.log("❌ Session has no user ID")
      return NextResponse.json({ 
        error: "Session has no user ID",
        step: "user_id_check",
        session_user: session.user
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
