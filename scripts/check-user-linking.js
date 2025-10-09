#!/usr/bin/env node

/**
 * Check User Linking Between Supabase Auth and Database
 * This script verifies that users are properly linked between Supabase Auth and our database
 */

const { PrismaClient } = require('@prisma/client')
const { createClient } = require('@supabase/supabase-js')

const prisma = new PrismaClient()

async function checkUserLinking() {
  console.log('🔍 Checking User Linking Between Supabase Auth and Database...\n')

  try {
    // Check database connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')

    // Get all users from database
    const dbUsers = await prisma.user.findMany({
      select: {
        id: true,
        supabaseAuthId: true,
        email: true,
        name: true,
        role: true,
        verified: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`\n📊 Database Users: ${dbUsers.length} total`)
    
    if (dbUsers.length === 0) {
      console.log('⚠️  No users found in database')
      console.log('This is normal if no one has logged in yet.')
      return
    }

    // Check linking status
    const linkedUsers = dbUsers.filter(user => user.supabaseAuthId)
    const unlinkedUsers = dbUsers.filter(user => !user.supabaseAuthId)

    console.log(`✅ Linked users (have supabaseAuthId): ${linkedUsers.length}`)
    console.log(`❌ Unlinked users (missing supabaseAuthId): ${unlinkedUsers.length}`)

    if (linkedUsers.length > 0) {
      console.log('\n🔗 Linked Users:')
      linkedUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.name || 'No name'}) - Role: ${user.role}`)
        console.log(`    Supabase ID: ${user.supabaseAuthId}`)
        console.log(`    Verified: ${user.verified ? '✅' : '❌'}`)
        console.log('')
      })
    }

    if (unlinkedUsers.length > 0) {
      console.log('\n⚠️  Unlinked Users (these need manual linking):')
      unlinkedUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.name || 'No name'}) - Role: ${user.role}`)
        console.log(`    Database ID: ${user.id}`)
        console.log(`    Created: ${user.createdAt}`)
        console.log('')
      })
      
      console.log('💡 To fix unlinked users:')
      console.log('1. These users need to log in again via OAuth')
      console.log('2. The system will automatically link them by email')
      console.log('3. Or manually update their supabaseAuthId in the database')
    }

    // Check for potential issues
    const duplicateEmails = {}
    dbUsers.forEach(user => {
      if (duplicateEmails[user.email]) {
        duplicateEmails[user.email].push(user)
      } else {
        duplicateEmails[user.email] = [user]
      }
    })

    const duplicates = Object.entries(duplicateEmails).filter(([email, users]) => users.length > 1)
    if (duplicates.length > 0) {
      console.log('\n⚠️  Duplicate Email Issues:')
      duplicates.forEach(([email, users]) => {
        console.log(`  Email: ${email} (${users.length} users)`)
        users.forEach(user => {
          console.log(`    - ID: ${user.id}, Supabase ID: ${user.supabaseAuthId || 'MISSING'}`)
        })
      })
    }

    // Summary
    console.log('\n📋 Summary:')
    console.log(`Total users: ${dbUsers.length}`)
    console.log(`Properly linked: ${linkedUsers.length}`)
    console.log(`Need linking: ${unlinkedUsers.length}`)
    console.log(`Duplicate emails: ${duplicates.length}`)

    if (linkedUsers.length === dbUsers.length && duplicates.length === 0) {
      console.log('\n🎉 All users are properly linked! Authentication should work correctly.')
    } else {
      console.log('\n🔧 Issues found that may cause authentication problems.')
    }

  } catch (error) {
    console.error('❌ Error checking user linking:', error.message)
    
    if (error.message.includes('database') || error.message.includes('connection')) {
      console.log('\n💡 Database connection issues:')
      console.log('1. Check DATABASE_URL environment variable')
      console.log('2. Ensure database is accessible')
      console.log('3. Check Supabase database status')
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Run the check
checkUserLinking().catch(console.error)
