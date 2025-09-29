#!/usr/bin/env node

/**
 * Script to promote users to admin role
 * Usage: node scripts/promote-to-admin.js <user-email>
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function promoteToAdmin(email) {
  try {
    console.log(`🔍 Looking for user with email: ${email}`)

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.error(`❌ User with email ${email} not found`)
      return
    }

    console.log(`✅ Found user: ${user.name || user.email} (ID: ${user.id})`)

    if (user.role === 'ADMIN') {
      console.log(`⚠️ User is already an admin`)
      return
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true
      }
    })

    console.log(`🎉 Successfully promoted user to admin:`)
    console.log(`   Name: ${updatedUser.name || 'No name'}`)
    console.log(`   Email: ${updatedUser.email}`)
    console.log(`   Role: ${updatedUser.role}`)
    console.log(`   Updated: ${updatedUser.updatedAt}`)

  } catch (error) {
    console.error('❌ Error promoting user to admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

async function listAdmins() {
  try {
    console.log('🔍 Current admin users:')

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    if (admins.length === 0) {
      console.log('   No admin users found')
      return
    }

    admins.forEach((admin, index) => {
      console.log(`   ${index + 1}. ${admin.name || 'No name'} (${admin.email}) - ${admin.role}`)
    })

  } catch (error) {
    console.error('❌ Error listing admins:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log('Usage:')
    console.log('  node scripts/promote-to-admin.js <user-email>  # Promote specific user')
    console.log('  node scripts/promote-to-admin.js list         # List current admins')
    process.exit(1)
  }

  const command = args[0]

  if (command === 'list') {
    await listAdmins()
  } else {
    await promoteToAdmin(command)
  }
}

main().catch(console.error)
