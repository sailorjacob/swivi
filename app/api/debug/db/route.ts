import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log("🔍 Debug: Checking database connection...")
    
    // Check if DATABASE_URL is set
    const hasDbUrl = !!process.env.DATABASE_URL
    console.log("DATABASE_URL set:", hasDbUrl)
    
    if (!hasDbUrl) {
      return NextResponse.json({
        error: "DATABASE_URL environment variable not set",
        status: "no_db_url"
      }, { status: 500 })
    }
    
    // Try to connect to database
    console.log("🔍 Attempting database connection...")
    await prisma.$connect()
    console.log("✅ Database connected")
    
    // Try a simple query
    console.log("🔍 Testing database query...")
    const userCount = await prisma.user.count()
    console.log("✅ Database query successful - user count:", userCount)
    
    return NextResponse.json({
      status: "success",
      database_connected: true,
      user_count: userCount,
      environment: process.env.NODE_ENV
    })
    
  } catch (error) {
    console.error("❌ Database debug failed:", error)
    
    let errorDetails = "Unknown error"
    if (error instanceof Error) {
      errorDetails = error.message
    }
    
    return NextResponse.json({
      error: "Database connection failed",
      details: errorDetails,
      status: "db_error"
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
