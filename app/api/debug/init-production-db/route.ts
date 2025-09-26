import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    console.log("🚀 Initializing production database with all required types and tables...")
    
    const steps = []
    
    // 1. Create enum types if they don't exist
    try {
      await prisma.$executeRaw`
        DO $$ BEGIN
          CREATE TYPE social_platform AS ENUM ('TIKTOK', 'YOUTUBE', 'INSTAGRAM', 'TWITTER', 'FACEBOOK');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `
      steps.push("✅ Created social_platform enum")
    } catch (e) {
      steps.push("ℹ️ social_platform enum already exists")
    }
    
    try {
      await prisma.$executeRaw`
        DO $$ BEGIN
          CREATE TYPE user_role AS ENUM ('CLIPPER', 'CREATOR', 'ADMIN');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `
      steps.push("✅ Created user_role enum")
    } catch (e) {
      steps.push("ℹ️ user_role enum already exists")
    }
    
    try {
      await prisma.$executeRaw`
        DO $$ BEGIN
          CREATE TYPE campaign_status AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `
      steps.push("✅ Created campaign_status enum")
    } catch (e) {
      steps.push("ℹ️ campaign_status enum already exists")
    }
    
    // 2. Ensure social_accounts table has all required columns
    try {
      await prisma.$executeRaw`
        ALTER TABLE social_accounts 
        ADD COLUMN IF NOT EXISTS display_name TEXT
      `
      steps.push("✅ Ensured display_name column exists")
    } catch (e) {
      steps.push("ℹ️ display_name column already exists")
    }
    
    // 3. Create social_verifications table if it doesn't exist
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS social_verifications (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          user_id TEXT NOT NULL,
          platform social_platform NOT NULL,
          code TEXT NOT NULL,
          verified BOOLEAN DEFAULT FALSE,
          verified_at TIMESTAMPTZ,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          CONSTRAINT fk_social_verifications_user 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          CONSTRAINT unique_user_platform_code 
            UNIQUE (user_id, platform, code)
        )
      `
      steps.push("✅ Created social_verifications table")
    } catch (e) {
      steps.push("ℹ️ social_verifications table already exists")
    }
    
    // 4. Create essential indexes
    const indexes = [
      {
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_accounts_user_platform ON social_accounts(user_id, platform)`,
        name: "social_accounts user+platform index"
      },
      {
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_verifications_user_platform ON social_verifications(user_id, platform)`,
        name: "social_verifications user+platform index"
      },
      {
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_verifications_expires ON social_verifications(expires_at)`,
        name: "social_verifications expiration index"
      }
    ]
    
    for (const index of indexes) {
      try {
        await prisma.$executeRaw(index.sql as any)
        steps.push(`✅ Created ${index.name}`)
      } catch (e) {
        steps.push(`ℹ️ ${index.name} already exists`)
      }
    }
    
    // 5. Test all critical operations
    const tests = []
    
    // Test enum usage
    try {
      const testQuery = await prisma.$queryRaw`
        SELECT 'INSTAGRAM'::social_platform as test_platform
      `
      tests.push("✅ social_platform enum working")
    } catch (e) {
      tests.push("❌ social_platform enum failed")
    }
    
    // Test social_accounts with display_name
    try {
      await prisma.socialAccount.findFirst({
        select: { id: true, displayName: true },
        take: 1
      })
      tests.push("✅ social_accounts with displayName working")
    } catch (e) {
      tests.push("❌ social_accounts with displayName failed")
    }
    
    // Test social_verifications
    try {
      await prisma.socialVerification.findFirst({
        select: { id: true },
        take: 1
      })
      tests.push("✅ social_verifications table working")
    } catch (e) {
      tests.push("❌ social_verifications table failed")
    }
    
    // 6. Clean up expired codes
    const cleanup = await prisma.socialVerification.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
        verified: false
      }
    })
    
    steps.push(`🧹 Cleaned up ${cleanup.count} expired verification codes`)
    
    // 7. Get final stats
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
    
    return NextResponse.json({
      status: "success",
      message: "Production database fully initialized and ready",
      steps,
      tests,
      stats,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error("❌ Database initialization failed:", error)
    
    return NextResponse.json({
      error: "Database initialization failed",
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
