import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const logs: string[] = []
    
    logs.push("🔄 Starting database schema sync...")

    // Check if the new unique constraint exists
    try {
      const result = await prisma.$queryRaw`
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints 
        WHERE table_name = 'social_accounts' 
        AND constraint_type = 'UNIQUE'
      `
      logs.push(`📋 Current constraints: ${JSON.stringify(result)}`)
    } catch (error) {
      logs.push(`⚠️ Could not check constraints: ${error}`)
    }

    // Try to add the new unique constraint if it doesn't exist
    try {
      await prisma.$executeRaw`
        ALTER TABLE social_accounts 
        DROP CONSTRAINT IF EXISTS social_accounts_userId_platform_key
      `
      logs.push("🗑️ Dropped old userId_platform constraint if it existed")
      
      await prisma.$executeRaw`
        ALTER TABLE social_accounts 
        ADD CONSTRAINT social_accounts_userId_platform_username_key 
        UNIQUE (user_id, platform, username)
      `
      logs.push("✅ Added new userId_platform_username unique constraint")
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        logs.push("✅ Unique constraint already exists")
      } else {
        logs.push(`❌ Constraint error: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    // Test the constraint by trying to create a duplicate
    try {
      const testUser = await prisma.user.findFirst()
      if (testUser) {
        // Try to create two accounts with same user/platform/username
        const testAccount1 = await prisma.socialAccount.create({
          data: {
            userId: testUser.id,
            platform: "TWITTER",
            username: "test_constraint_check",
            platformId: "test_constraint_check",
            verified: false
          }
        })
        logs.push(`✅ Created test account: ${testAccount1.id}`)

        try {
          await prisma.socialAccount.create({
            data: {
              userId: testUser.id,
              platform: "TWITTER", 
              username: "test_constraint_check", // Same combo - should fail
              platformId: "test_constraint_check",
              verified: false
            }
          })
          logs.push("❌ ERROR: Duplicate was allowed - constraint not working!")
        } catch (duplicateError) {
          logs.push("✅ Duplicate correctly rejected - constraint working!")
        }

        // Clean up test account
        await prisma.socialAccount.delete({
          where: { id: testAccount1.id }
        })
        logs.push("🧹 Cleaned up test account")
      }
    } catch (testError) {
      logs.push(`⚠️ Constraint test failed: ${testError instanceof Error ? testError.message : String(testError)}`)
    }

    return NextResponse.json({
      success: true,
      message: "Schema sync completed",
      logs
    })

  } catch (error) {
    console.error('Schema sync error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Schema sync failed",
      logs: [`❌ Fatal error: ${error instanceof Error ? error.message : String(error)}`]
    }, { status: 500 })
  }
}
