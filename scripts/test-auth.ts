#!/usr/bin/env node
/**
 * Test Authentication Flow
 * Run: npx tsx scripts/test-auth.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...')
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}

async function checkUsers() {
  console.log('\n📊 Checking existing users...')
  try {
    const userCount = await prisma.user.count()
    console.log(`Total users: ${userCount}`)
    
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      }
    })
    
    if (recentUsers.length > 0) {
      console.log('\nRecent users:')
      recentUsers.forEach(user => {
        console.log(`- ${user.email} (${user.role}) - ${user.createdAt.toLocaleDateString()}`)
      })
    } else {
      console.log('No users found yet')
    }
    
    // Check OAuth users specifically
    const oauthUsers = await prisma.account.findMany({
      take: 5,
      include: { user: true },
      orderBy: { user: { createdAt: 'desc' } }
    })
    
    if (oauthUsers.length > 0) {
      console.log('\nOAuth accounts:')
      oauthUsers.forEach(account => {
        console.log(`- ${account.user.email} via ${account.provider}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error)
  }
}

async function testAuthEndpoints() {
  console.log('\n🌐 Testing auth endpoints...')
  
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const endpoints = [
    '/api/health',
    '/api/auth/providers',
    '/api/auth/csrf'
  ]
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`)
      const status = response.ok ? '✅' : '❌'
      console.log(`${status} ${endpoint} - ${response.status}`)
      
      if (endpoint === '/api/health') {
        const data = await response.json()
        console.log(`   Database: ${data.database}`)
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Failed to connect`)
    }
  }
}

async function main() {
  console.log('🚀 Swivi Authentication Test Suite\n')
  
  // Test database
  const dbConnected = await testDatabaseConnection()
  
  if (dbConnected) {
    // Check users
    await checkUsers()
  }
  
  // Test endpoints
  await testAuthEndpoints()
  
  console.log('\n✨ Test complete!')
  
  await prisma.$disconnect()
}

main().catch(console.error)
