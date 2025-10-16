#!/usr/bin/env node

/**
 * URGENT FIX: Remove deadline column from campaigns table
 * This fixes the "Null constraint violation on the fields: (deadline)" error
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixDeadlineColumn() {
  console.log('🚨 URGENT FIX: Removing deadline column from campaigns table...\n')

  try {
    // Check if we can connect to the database
    await prisma.$connect()
    console.log('✅ Database connected successfully')

    // Check current table structure
    console.log('\n🔍 Checking current campaigns table structure...')
    
    try {
      // Try to query the deadline column - if this fails, it's already removed
      await prisma.$queryRaw`SELECT "deadline" FROM campaigns LIMIT 1`
      console.log('⚠️  deadline column still exists - proceeding with removal...')
      
      // Drop any indexes that reference the deadline column
      console.log('\n🗑️  Dropping deadline-related indexes...')
      await prisma.$executeRaw`DROP INDEX IF EXISTS "campaigns_endDate_idx"`
      await prisma.$executeRaw`DROP INDEX IF EXISTS "campaigns_deadline_idx"`
      console.log('✅ Indexes dropped (if they existed)')

      // Remove the deadline column
      console.log('\n🔧 Removing deadline column...')
      await prisma.$executeRaw`ALTER TABLE "campaigns" DROP COLUMN IF EXISTS "deadline"`
      console.log('✅ deadline column removed successfully!')

      // Test that campaign creation works now
      console.log('\n🧪 Testing campaign creation...')
      const testCampaign = await prisma.campaign.create({
        data: {
          title: 'Test Campaign - DELETE ME',
          description: 'This is a test campaign to verify the deadline column removal worked',
          creator: 'Test Creator',
          budget: 1000.00,
          payoutRate: 2.50,
          status: 'DRAFT',
          targetPlatforms: ['TIKTOK'],
          requirements: []
        }
      })
      console.log('✅ Test campaign created successfully:', testCampaign.id)

      // Clean up test campaign
      await prisma.campaign.delete({
        where: { id: testCampaign.id }
      })
      console.log('✅ Test campaign cleaned up')

    } catch (error) {
      if (error.message.includes('deadline') && error.message.includes('does not exist')) {
        console.log('✅ deadline column already removed - no action needed!')
      } else {
        throw error
      }
    }

    console.log('\n🎉 SUCCESS: Campaign creation should now work properly!')
    console.log('💡 You can now create campaigns without the deadline field.')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error('\n🔧 Manual fix required:')
    console.error('Run this SQL in your production database:')
    console.error('ALTER TABLE "campaigns" DROP COLUMN IF EXISTS "deadline";')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the fix
fixDeadlineColumn()
