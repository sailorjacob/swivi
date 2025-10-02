#!/usr/bin/env node

/**
 * Simple database test without connection pooling issues
 */

const { PrismaClient } = require('@prisma/client')

async function testDatabase() {
  let prisma

  try {
    console.log('🔍 Testing database connection...')

    // Create a fresh Prisma client without connection pooling
    prisma = new PrismaClient({
      log: ['error', 'warn'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })

    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connected successfully!')

    // Count users
    const userCount = await prisma.user.count()
    console.log(`✅ Found ${userCount} users in database`)

    if (userCount > 0) {
      // Get first few users
      const users = await prisma.user.findMany({
        take: 3,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      })

      console.log('✅ Recent users:')
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name || 'No name'} (${user.email}) - ${user.role}`)
      })

      // Check if admin exists
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' }
      })

      if (adminCount === 0) {
        console.log('⚠️  No admin users found. Promoting first user to admin...')
        const firstUser = users[0]

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
      } else {
        console.log(`✅ Found ${adminCount} admin user(s)`)
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.code) {
      console.error('Error code:', error.code)
    }
  } finally {
    if (prisma) {
      await prisma.$disconnect()
    }
  }
}

testDatabase().catch(console.error)
