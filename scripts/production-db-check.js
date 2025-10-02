#!/usr/bin/env node

/**
 * Production database connection test
 * Use this to diagnose database issues in production
 */

require('dotenv').config({ path: '.env' })

async function checkProductionDatabase() {
  console.log('🔍 Production Database Connection Test')
  console.log('=====================================')

  const { PrismaClient } = require('@prisma/client')

  let prisma

  try {
    console.log('🔌 Attempting database connection...')

    // Create Prisma client with production-optimized settings
    prisma = new PrismaClient({
      log: ['error', 'warn'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      errorFormat: 'minimal',
      transactionOptions: {
        maxWait: 10000, // 10 seconds
        timeout: 8000,  // 8 seconds
      }
    })

    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connected successfully!')

    // Test user query
    console.log('🔍 Testing user queries...')
    const userCount = await prisma.user.count()
    console.log(`✅ Found ${userCount} users in database`)

    // Test admin users
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    })
    console.log(`✅ Found ${adminCount} admin users`)

    // Test role-based query
    const clippers = await prisma.user.count({
      where: { role: 'CLIPPER' }
    })
    console.log(`✅ Found ${clippers} clipper users`)

    console.log('\n📊 Database Status: HEALTHY')
    console.log('All queries executed successfully')

  } catch (error) {
    console.error('❌ Database connection failed:', error.message)

    if (error.code) {
      console.error('Error code:', error.code)
    }

    if (error.message.includes('connect')) {
      console.error('\n🔧 Possible solutions:')
      console.error('- Check DATABASE_URL environment variable')
      console.error('- Verify Supabase project is active')
      console.error('- Check network connectivity to database')
    }

    console.log('\n📊 Database Status: UNHEALTHY')
  } finally {
    if (prisma) {
      await prisma.$disconnect()
    }
  }
}

checkProductionDatabase().catch(console.error)
