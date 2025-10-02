#!/usr/bin/env node

/**
 * Script to check users and promote one to admin
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...')

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`✅ Found ${users.length} users:`)
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name || 'No name'} (${user.email}) - ${user.role}`)
    })

    // If no admin exists, promote the first user to admin
    const adminExists = users.some(user => user.role === 'ADMIN')
    if (!adminExists && users.length > 0) {
      const firstUser = users[0]
      console.log(`\n🔄 No admin found. Promoting ${firstUser.name || firstUser.email} to admin...`)

      const updatedUser = await prisma.user.update({
        where: { id: firstUser.id },
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
    } else if (adminExists) {
      console.log('\n✅ Admin user already exists')
    }

  } catch (error) {
    console.error('❌ Error checking users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers().catch(console.error)
