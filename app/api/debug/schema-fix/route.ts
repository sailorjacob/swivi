import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    console.log("🔧 Attempting to fix database schema...")
    
    // Check if the display_name column exists
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'social_accounts' 
      AND column_name = 'display_name'
    ` as any[]
    
    const hasDisplayName = result.length > 0
    console.log("display_name column exists:", hasDisplayName)
    
    if (!hasDisplayName) {
      console.log("Adding display_name column...")
      await prisma.$executeRaw`
        ALTER TABLE social_accounts 
        ADD COLUMN display_name TEXT
      `
      console.log("✅ Added display_name column")
    }
    
    // Check if social_verifications table exists
    const verificationTableCheck = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'social_verifications'
    ` as any[]
    
    const hasVerificationTable = verificationTableCheck.length > 0
    console.log("social_verifications table exists:", hasVerificationTable)
    
    if (!hasVerificationTable) {
      console.log("Creating social_verifications table...")
      await prisma.$executeRaw`
        CREATE TABLE social_verifications (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          platform TEXT NOT NULL,
          code TEXT NOT NULL,
          verified BOOLEAN DEFAULT FALSE,
          verified_at TIMESTAMPTZ,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `
      
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX social_verifications_user_platform_code_idx 
        ON social_verifications(user_id, platform, code)
      `
      
      console.log("✅ Created social_verifications table")
    }
    
    return NextResponse.json({
      status: "success",
      message: "Database schema updated successfully",
      changes: {
        added_display_name: !hasDisplayName,
        added_verification_table: !hasVerificationTable
      }
    })
    
  } catch (error) {
    console.error("❌ Schema fix failed:", error)
    
    return NextResponse.json({
      error: "Schema fix failed",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
