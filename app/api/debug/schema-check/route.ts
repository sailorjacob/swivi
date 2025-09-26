import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log("🔍 Checking database schema...")
    
    // Check social_accounts table structure
    const socialAccountsColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'social_accounts'
      ORDER BY ordinal_position
    ` as any[]
    
    // Check if social_verifications table exists
    const verificationTableCheck = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'social_verifications'
    ` as any[]
    
    const hasVerificationTable = verificationTableCheck.length > 0
    
    let verificationColumns = []
    if (hasVerificationTable) {
      verificationColumns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'social_verifications'
        ORDER BY ordinal_position
      ` as any[]
    }
    
    const hasDisplayName = socialAccountsColumns.some(col => col.column_name === 'display_name')
    
    return NextResponse.json({
      status: "success",
      schema_check: {
        social_accounts: {
          table_exists: socialAccountsColumns.length > 0,
          has_display_name: hasDisplayName,
          columns: socialAccountsColumns
        },
        social_verifications: {
          table_exists: hasVerificationTable,
          columns: verificationColumns
        }
      },
      issues: {
        missing_display_name: !hasDisplayName,
        missing_verification_table: !hasVerificationTable
      }
    })
    
  } catch (error) {
    console.error("❌ Schema check failed:", error)
    
    return NextResponse.json({
      error: "Schema check failed",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
