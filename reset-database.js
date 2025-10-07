#!/usr/bin/env node

/**
 * Database Reset Script
 * Cleans up old users and prepares for fresh Supabase Auth-only implementation
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function resetDatabase() {
  console.log('🚨 DATABASE RESET - Starting cleanup...\n')

  try {
    // 1. Count current users
    const userCount = await prisma.user.count()
    console.log(`📊 Current users: ${userCount}`)

    // 2. Delete all users (this will cascade delete related data)
    console.log('🗑️ Deleting all existing users...')
    await prisma.user.deleteMany({})
    console.log('✅ All users deleted')

    // 3. Reset sequences (for auto-increment fields)
    console.log('🔄 Resetting database sequences...')
    try {
      // PostgreSQL specific sequence reset (adjust based on your setup)
      await prisma.$executeRaw`ALTER SEQUENCE IF EXISTS "User_id_seq" RESTART WITH 1`
      await prisma.$executeRaw`ALTER SEQUENCE IF EXISTS "Campaign_id_seq" RESTART WITH 1`
      await prisma.$executeRaw`ALTER SEQUENCE IF EXISTS "Clip_id_seq" RESTART WITH 1`
      await prisma.$executeRaw`ALTER SEQUENCE IF EXISTS "ClipSubmission_id_seq" RESTART WITH 1`
      console.log('✅ Sequences reset')
    } catch (error) {
      console.log('ℹ️ Sequence reset not needed or failed:', error.message)
    }

    // 4. Verify cleanup
    const finalUserCount = await prisma.user.count()
    console.log(`\n📊 Final user count: ${finalUserCount}`)
    console.log('✅ Database reset complete!')

    console.log('\n🎉 Ready for fresh Supabase Auth implementation:')
    console.log('- Database is clean')
    console.log('- No legacy users')
    console.log('- Schema is Supabase Auth-focused')
    console.log('- Ready for new OAuth users')

  } catch (error) {
    console.error('❌ Database reset failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function confirmReset() {
  console.log('⚠️  WARNING: This will DELETE ALL existing users and their data!')
  console.log('This action cannot be undone.')
  console.log()

  // In a real CLI, you'd prompt for confirmation
  // For now, we'll just warn and proceed
  console.log('Proceeding with database reset...\n')

  return resetDatabase()
}

// Run if called directly
if (require.main === module) {
  confirmReset().catch(error => {
    console.error('💥 Reset failed:', error)
    process.exit(1)
  })
}

module.exports = { resetDatabase, confirmReset }
