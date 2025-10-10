#!/usr/bin/env node

/**
 * Script to promote a user to admin role
 * Usage: node scripts/promote-user-to-admin.js <email>
 * Example: node scripts/promote-user-to-admin.js x2sides@gmail.com
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function promoteUserToAdmin(email) {
  try {
    console.log(`🔍 Looking for user with email: ${email}`)
    
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        supabaseAuthId: true
      }
    })

    if (!user) {
      console.error(`❌ User not found with email: ${email}`)
      console.log('\n💡 Available users:')
      const allUsers = await prisma.user.findMany({
        select: { email: true, name: true, role: true },
        take: 10
      })
      allUsers.forEach(u => console.log(`   - ${u.email} (${u.name || 'No name'}) - ${u.role}`))
      return
    }

    console.log(`✅ Found user:`)
    console.log(`   - ID: ${user.id}`)
    console.log(`   - Email: ${user.email}`)
    console.log(`   - Name: ${user.name || 'No name'}`)
    console.log(`   - Current Role: ${user.role}`)
    console.log(`   - Supabase Auth ID: ${user.supabaseAuthId}`)

    if (user.role === 'ADMIN') {
      console.log(`✅ User is already an admin!`)
      return
    }

    // Promote to admin
    console.log(`\n🔄 Promoting user to ADMIN role...`)
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })

    console.log(`\n🎉 SUCCESS! User promoted to admin:`)
    console.log(`   - Email: ${updatedUser.email}`)
    console.log(`   - Name: ${updatedUser.name || 'No name'}`)
    console.log(`   - New Role: ${updatedUser.role}`)
    
    console.log(`\n📋 Next steps:`)
    console.log(`   1. Log out and log back in to refresh your session`)
    console.log(`   2. Visit /clippers/dashboard - you should see "Admin Dashboard" button`)
    console.log(`   3. Click "Admin Dashboard" to access /admin`)
    console.log(`   4. Test campaign creation and management`)

  } catch (error) {
    console.error('❌ Error promoting user to admin:', error)
    
    if (error.message?.includes('prepared statement')) {
      console.log('\n💡 Database connection issue detected. Retrying...')
      await prisma.$disconnect()
      await prisma.$connect()
      // Retry once
      return promoteUserToAdmin(email)
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Get email from command line arguments
const email = process.argv[2]

if (!email) {
  console.error('❌ Please provide an email address')
  console.log('Usage: node scripts/promote-user-to-admin.js <email>')
  console.log('Example: node scripts/promote-user-to-admin.js x2sides@gmail.com')
  process.exit(1)
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(email)) {
  console.error('❌ Invalid email format')
  process.exit(1)
}

console.log('🚀 Starting user promotion to admin...')
promoteUserToAdmin(email)
  .then(() => {
    console.log('\n✅ Script completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
