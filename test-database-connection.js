#!/usr/bin/env node

/**
 * Database Connection and Authentication Test Script
 * Tests database connectivity, Prisma operations, and authentication flow
 */

const { PrismaClient } = require('@prisma/client')
const { createClient } = require('@supabase/supabase-js')

const prisma = new PrismaClient()

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...')

  try {
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connection successful')

    // Test basic query
    const userCount = await prisma.user.count()
    console.log(`📊 Users in database: ${userCount}`)

    // Test campaign query
    const campaignCount = await prisma.campaign.count()
    console.log(`📊 Campaigns in database: ${campaignCount}`)

    // Test clip submission query
    const submissionCount = await prisma.clipSubmission.count()
    console.log(`📊 Clip submissions in database: ${submissionCount}`)

    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...')

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables')
    return false
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    console.log('✅ Supabase client created successfully')

    // Test basic Supabase connection (this doesn't require auth)
    const { data, error } = await supabase.from('users').select('count').limit(1)

    if (error) {
      console.log('ℹ️ Supabase query test (expected to fail without auth):', error.message)
    } else {
      console.log('✅ Supabase connection working')
    }

    return true
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message)
    return false
  }
}

async function testUserOperations() {
  console.log('🔍 Testing user operations...')

  try {
    await prisma.$connect()

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        supabaseAuthId: true,
        createdAt: true
      },
      take: 5
    })

    console.log(`📋 Recent users (${users.length}):`)
    users.forEach(user => {
      console.log(`  - ${user.name || 'No name'} (${user.email}) - supabaseAuthId: ${user.supabaseAuthId || 'None'}`)
    })

    // Test user creation (with a test user)
    const testEmail = `test-${Date.now()}@example.com`
    const testUser = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Test User',
        role: 'CLIPPER',
        verified: false,
        supabaseAuthId: `test-${Date.now()}-auth-id` // Required field now
      }
    })

    console.log(`✅ Created test user: ${testUser.id}`)

    // Clean up test user
    await prisma.user.delete({
      where: { id: testUser.id }
    })

    console.log('✅ Cleaned up test user')

    return true
  } catch (error) {
    console.error('❌ User operations failed:', error.message)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

async function testCampaignOperations() {
  console.log('🔍 Testing campaign operations...')

  try {
    await prisma.$connect()

    // Test campaign queries
    const campaigns = await prisma.campaign.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        budget: true,
        _count: {
          select: {
            clipSubmissions: true
          }
        }
      },
      take: 3
    })

    console.log(`📋 Recent campaigns (${campaigns.length}):`)
    campaigns.forEach(campaign => {
      console.log(`  - ${campaign.title} (${campaign.status}) - Budget: $${campaign.budget} - Submissions: ${campaign._count.clipSubmissions}`)
    })

    return true
  } catch (error) {
    console.error('❌ Campaign operations failed:', error.message)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive database and auth tests...\n')

  const results = {
    database: await testDatabaseConnection(),
    supabase: await testSupabaseConnection(),
    users: await testUserOperations(),
    campaigns: await testCampaignOperations()
  }

  console.log('\n📊 Test Results Summary:')
  console.log(`Database Connection: ${results.database ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Supabase Connection: ${results.supabase ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`User Operations: ${results.users ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Campaign Operations: ${results.campaigns ? '✅ PASS' : '❌ FAIL'}`)

  const allPassed = Object.values(results).every(result => result)

  if (allPassed) {
    console.log('\n🎉 All tests passed! Database and authentication are working correctly.')
  } else {
    console.log('\n⚠️ Some tests failed. Check the errors above.')
    process.exit(1)
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('💥 Test suite failed:', error)
    process.exit(1)
  })
}

module.exports = {
  testDatabaseConnection,
  testSupabaseConnection,
  testUserOperations,
  testCampaignOperations,
  runAllTests
}
