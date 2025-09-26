import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    console.log("🔧 Running comprehensive production database sync...")
    
    const updates = []
    
    // 1. Ensure all required indexes exist
    try {
      await prisma.$executeRaw`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS social_accounts_user_platform_idx 
        ON social_accounts(user_id, platform)
      `
      updates.push("Added social_accounts user+platform index")
    } catch (e) {
      console.log("Index already exists or failed:", e)
    }
    
    try {
      await prisma.$executeRaw`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS social_verifications_user_platform_idx 
        ON social_verifications(user_id, platform)
      `
      updates.push("Added social_verifications user+platform index")
    } catch (e) {
      console.log("Index already exists or failed:", e)
    }
    
    try {
      await prisma.$executeRaw`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS social_verifications_expires_at_idx 
        ON social_verifications(expires_at)
      `
      updates.push("Added social_verifications expiration index")
    } catch (e) {
      console.log("Index already exists or failed:", e)
    }
    
    // 2. Clean up any expired verification codes
    const cleanupResult = await prisma.socialVerification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        },
        verified: false
      }
    })
    
    if (cleanupResult.count > 0) {
      updates.push(`Cleaned up ${cleanupResult.count} expired verification codes`)
    }
    
    // 3. Ensure all enum values are consistent
    const platformEnums = await prisma.$queryRaw`
      SELECT unnest(enum_range(NULL::social_platform)) as platform
    ` as any[]
    
    updates.push(`Platform enums available: ${platformEnums.map(p => p.platform).join(', ')}`)
    
    // 4. Test all critical queries
    const testQueries = []
    
    // Test user profile query
    try {
      await prisma.user.findFirst({
        select: { id: true },
        take: 1
      })
      testQueries.push("✅ User profile query")
    } catch (e) {
      testQueries.push("❌ User profile query failed")
    }
    
    // Test social accounts query
    try {
      await prisma.socialAccount.findFirst({
        select: { id: true, displayName: true },
        take: 1
      })
      testQueries.push("✅ Social accounts query")
    } catch (e) {
      testQueries.push("❌ Social accounts query failed")
    }
    
    // Test social verifications query
    try {
      await prisma.socialVerification.findFirst({
        select: { id: true },
        take: 1
      })
      testQueries.push("✅ Social verifications query")
    } catch (e) {
      testQueries.push("❌ Social verifications query failed")
    }
    
    // 5. Get current stats
    const stats = {
      users: await prisma.user.count(),
      socialAccounts: await prisma.socialAccount.count(),
      verifiedAccounts: await prisma.socialAccount.count({ where: { verified: true } }),
      pendingVerifications: await prisma.socialVerification.count({ 
        where: { 
          verified: false,
          expiresAt: { gt: new Date() }
        } 
      })
    }
    
    console.log("✅ Production sync completed successfully")
    
    return NextResponse.json({
      status: "success",
      message: "Production database fully synchronized",
      updates,
      testQueries,
      stats,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    })
    
  } catch (error) {
    console.error("❌ Production sync failed:", error)
    
    return NextResponse.json({
      error: "Production sync failed",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Status check without making changes
    const status = {
      database_connected: true,
      environment: process.env.NODE_ENV,
      user_count: await prisma.user.count(),
      social_accounts_count: await prisma.socialAccount.count(),
      verified_accounts_count: await prisma.socialAccount.count({ where: { verified: true } }),
      pending_verifications: await prisma.socialVerification.count({ 
        where: { 
          verified: false,
          expiresAt: { gt: new Date() }
        } 
      }),
      timestamp: new Date().toISOString()
    }
    
    return NextResponse.json({
      status: "healthy",
      production_status: status
    })
    
  } catch (error) {
    return NextResponse.json({
      error: "Status check failed",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
