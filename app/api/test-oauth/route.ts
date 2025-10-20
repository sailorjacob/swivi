import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log("🔍 Testing OAuth callback simulation...")
    
    // Test database connection
    await prisma.$connect()
    console.log("✅ Database connected in production")
    
    // Test user creation (like OAuth callback does)
    const testEmail = `oauth-test-${Date.now()}@example.com`
    
    console.log("🔄 Attempting to create test user...")
    const testUser = await prisma.user.create({
      data: {
        email: testEmail,
        name: "OAuth Test User",
        role: "CLIPPER",
        verified: false,
        supabaseAuthId: `test-auth-id-${Date.now()}`, // Required field for Supabase Auth integration
      }
    })
    
    console.log("✅ User created successfully:", testUser.email)
    
    // Clean up test user
    await prisma.user.delete({
      where: { id: testUser.id }
    })
    
    console.log("✅ User deleted successfully")
    
    // Check current user count
    const userCount = await prisma.user.count()
    console.log("📊 Current users in database:", userCount)
    
    await prisma.$disconnect()
    
    return NextResponse.json({
      success: true,
      message: "OAuth callback simulation successful",
      userCount: userCount,
      testEmail: testEmail
    })
    
  } catch (error) {
    console.error("❌ OAuth callback simulation failed:", error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      details: "This simulates what happens during OAuth callback"
    }, { status: 500 })
  }
}
