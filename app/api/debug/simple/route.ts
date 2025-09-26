import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔍 Simple debug endpoint called")
    
    // Test basic functionality
    const timestamp = new Date().toISOString()
    const environment = process.env.NODE_ENV
    
    console.log("✅ Basic functionality working")
    
    return NextResponse.json({
      status: "success",
      message: "Basic API functionality is working",
      timestamp,
      environment,
      vercel_region: process.env.VERCEL_REGION || "unknown",
      has_database_url: !!process.env.DATABASE_URL,
      has_nextauth_secret: !!process.env.NEXTAUTH_SECRET,
      has_nextauth_url: !!process.env.NEXTAUTH_URL
    })
    
  } catch (error) {
    console.error("❌ Simple debug failed:", error)
    
    return NextResponse.json({
      error: "Basic API functionality failed",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
