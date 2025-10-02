#!/usr/bin/env node

/**
 * Test script for admin authentication
 * Tests the complete authentication flow for admin users
 */

const { PrismaClient } = require('@prisma/client')
const https = require('https')
const http = require('http')

const prisma = new PrismaClient()

// Simple fetch replacement for testing
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http

    const req = client.get(url, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          json: () => Promise.resolve(JSON.parse(data || '{}'))
        })
      })
    })

    req.on('error', reject)
    req.setTimeout(5000, () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })
  })
}

async function testAdminAuthentication() {
  console.log('🧪 Testing Admin Authentication Flow...\n')

  try {
    // 1. Check if we have admin users
    console.log('1️⃣ Checking for admin users...')
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    if (admins.length === 0) {
      console.log('❌ No admin users found in database')
      console.log('💡 Run: node scripts/promote-to-admin.js <email>')
      return
    }

    console.log(`✅ Found ${admins.length} admin user(s):`)
    admins.forEach(admin => {
      console.log(`   - ${admin.name || 'No name'} (${admin.email})`)
    })

    // 2. Test database connection
    console.log('\n2️⃣ Testing database connection...')
    const userCount = await prisma.user.count()
    console.log(`✅ Database connected - Total users: ${userCount}`)

    // 3. Test API endpoint (without authentication first)
    console.log('\n3️⃣ Testing API endpoint without authentication...')
    try {
      const response = await makeRequest('http://localhost:3000/api/admin/users')
      console.log(`   Status: ${response.status} ${response.statusText}`)

      if (response.status === 401) {
        console.log('✅ API correctly returns 401 for unauthenticated requests')
      } else {
        console.log('⚠️ API should return 401 for unauthenticated requests')
      }
    } catch (error) {
      console.log(`❌ Failed to reach API: ${error.message}`)
      console.log('💡 Make sure the dev server is running: npm run dev')
    }

    // 4. Check environment variables
    console.log('\n4️⃣ Checking environment configuration...')
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ]

    const missing = requiredEnvVars.filter(varName => !process.env[varName])
    if (missing.length > 0) {
      console.log(`❌ Missing environment variables: ${missing.join(', ')}`)
    } else {
      console.log('✅ All required environment variables are set')
    }

    // 5. Check OAuth configuration
    console.log('\n5️⃣ Checking OAuth configuration...')
    const oauthProviders = ['GOOGLE_CLIENT_ID', 'DISCORD_CLIENT_ID']
    const configuredProviders = oauthProviders.filter(provider => process.env[provider])

    if (configuredProviders.length === 0) {
      console.log('⚠️ No OAuth providers configured')
      console.log('💡 Configure at least one OAuth provider in .env file')
    } else {
      console.log(`✅ OAuth providers configured: ${configuredProviders.join(', ')}`)
    }

    console.log('\n🎉 Admin authentication tests completed!')
    console.log('\n📋 Next steps:')
    console.log('1. Start dev server: npm run dev')
    console.log('2. Visit: http://localhost:3000/clippers/login')
    console.log('3. Sign in with Discord or Google')
    console.log('4. Navigate to: http://localhost:3000/admin/users')
    console.log('5. Check browser console for any errors')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testAdminAuthentication().catch(console.error)
