#!/usr/bin/env node

/**
 * Migration script for existing users who don't have supabaseAuthId
 * This script helps migrate users created before Supabase Auth integration
 */

const { PrismaClient } = require('@prisma/client')
const { createClient } = require('@supabase/supabase-js')

const prisma = new PrismaClient()

// Initialize Supabase client for checking existing auth users
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function migrateExistingUsers() {
  console.log('🚀 Starting migration of existing users...\n')

  try {
    // 1. Get all users from our database
    console.log('📋 Fetching users from database...')
    const dbUsers = await prisma.user.findMany({
      where: {
        OR: [
          { supabaseAuthId: null },
          { supabaseAuthId: undefined },
          { supabaseAuthId: '' }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
        supabaseAuthId: true
      }
    })

    console.log(`Found ${dbUsers.length} users without supabaseAuthId`)

    if (dbUsers.length === 0) {
      console.log('✅ No users need migration')
      return
    }

    // 2. For each user, check if they exist in Supabase Auth
    console.log('\n🔍 Checking Supabase Auth for existing users...')
    let migrated = 0
    let skipped = 0

    for (const user of dbUsers) {
      try {
        // Check if user exists in Supabase Auth by email
        const { data: authUsers, error } = await supabase.auth.admin.listUsers()

        if (error) {
          console.error(`❌ Error checking auth users:`, error.message)
          continue
        }

        // Find matching user in Supabase Auth
        const matchingAuthUser = authUsers.users.find(authUser =>
          authUser.email === user.email
        )

        if (matchingAuthUser) {
          console.log(`✅ Found matching Supabase Auth user for ${user.email}`)

          // Update our database user with the supabaseAuthId
          await prisma.user.update({
            where: { id: user.id },
            data: {
              supabaseAuthId: matchingAuthUser.id,
              verified: matchingAuthUser.email_confirmed_at ? true : false
            }
          })

          console.log(`   ↳ Updated user ${user.id} with supabaseAuthId: ${matchingAuthUser.id}`)
          migrated++
        } else {
          console.log(`⚠️  No Supabase Auth user found for ${user.email} - keeping as is`)
          skipped++
        }
      } catch (error) {
        console.error(`❌ Error processing user ${user.email}:`, error.message)
        skipped++
      }
    }

    console.log(`\n📊 Migration Summary:`)
    console.log(`   ✅ Migrated: ${migrated} users`)
    console.log(`   ⚠️  Skipped: ${skipped} users`)
    console.log(`   📧 Total: ${dbUsers.length} users processed`)

    // 3. Show remaining users without supabaseAuthId
    const remainingUsers = await prisma.user.count({
      where: {
        OR: [
          { supabaseAuthId: null },
          { supabaseAuthId: undefined },
          { supabaseAuthId: '' }
        ]
      }
    })

    if (remainingUsers > 0) {
      console.log(`\n⚠️  ${remainingUsers} users still don't have supabaseAuthId`)
      console.log('These users may need manual intervention or were created outside of Supabase Auth')
    } else {
      console.log('\n🎉 All users now have proper supabaseAuthId!')
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Handle command line arguments
const args = process.argv.slice(2)
if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: node migrate-existing-users.js')
  console.log('')
  console.log('This script migrates existing users to use Supabase Auth IDs.')
  console.log('It checks each user without a supabaseAuthId and tries to find')
  console.log('a matching user in Supabase Auth by email address.')
  console.log('')
  console.log('Options:')
  console.log('  --help, -h    Show this help message')
  process.exit(0)
}

migrateExistingUsers().catch(console.error)
