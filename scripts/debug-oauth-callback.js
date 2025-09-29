#!/usr/bin/env node
/**
 * OAuth Callback Debug Script
 * This helps debug why OAuth callbacks are failing
 */

const { PrismaClient } = require('@prisma/client')
const https = require('https')

const prisma = new PrismaClient()

async function checkDatabase() {
  console.log('🗄️ Checking Database Connection...\n')
  
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Check if tables exist
    const userCount = await prisma.user.count()
    console.log(`📊 Current users in database: ${userCount}`)
    
    // Check recent users
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        accounts: {
          select: {
            provider: true,
            createdAt: true
          }
        }
      }
    })
    
    if (recentUsers.length > 0) {
      console.log('\n📋 Recent users:')
      recentUsers.forEach(user => {
        const providers = user.accounts.map(acc => acc.provider).join(', ')
        console.log(`  - ${user.email} (${providers}) - ${user.createdAt.toISOString()}`)
      })
    } else {
      console.log('❌ No users found - OAuth callbacks are not creating users')
    }
    
    // Check accounts table
    const accountCount = await prisma.account.count()
    console.log(`📊 OAuth accounts in database: ${accountCount}`)
    
    if (accountCount > 0) {
      const recentAccounts = await prisma.account.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          provider: true,
          createdAt: true,
          user: {
            select: { email: true }
          }
        }
      })
      
      console.log('\n🔗 Recent OAuth accounts:')
      recentAccounts.forEach(account => {
        console.log(`  - ${account.provider}: ${account.user.email} - ${account.createdAt.toISOString()}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message)
    return false
  } finally {
    await prisma.$disconnect()
  }
  
  return true
}

async function checkAuthEndpoints() {
  console.log('\n🌐 Checking Auth Endpoints...\n')
  
  const endpoints = [
    'https://www.swivimedia.com/api/auth/providers',
    'https://www.swivimedia.com/api/auth/csrf',
    'https://www.swivimedia.com/api/auth/session'
  ]
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint)
      const data = await response.json()
      
      if (response.ok) {
        console.log(`✅ ${endpoint} - ${response.status}`)
        
        if (endpoint.includes('providers')) {
          console.log(`   Available providers: ${Object.keys(data).join(', ')}`)
        } else if (endpoint.includes('session')) {
          console.log(`   Session: ${data.user ? 'Active' : 'None'}`)
        }
      } else {
        console.log(`❌ ${endpoint} - ${response.status}`)
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.message}`)
    }
  }
}

async function simulateOAuthCallback() {
  console.log('\n🔄 Simulating OAuth Callback Process...\n')
  
  // Test what happens when we try to create a user manually
  try {
    console.log('Testing user creation process...')
    
    const testEmail = `test-${Date.now()}@example.com`
    const testUser = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Test User',
        role: 'CLIPPER',
        verified: false,
      }
    })
    
    console.log('✅ User creation works:', testUser.email)
    
    // Clean up test user
    await prisma.user.delete({
      where: { id: testUser.id }
    })
    
    console.log('✅ User deletion works')
    
  } catch (error) {
    console.error('❌ User creation failed:', error.message)
    console.error('   This is likely why OAuth callbacks are failing!')
  }
}

async function checkEnvironmentVariables() {
  console.log('\n🔧 Checking Environment Variables...\n')
  
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_URL', 
    'NEXTAUTH_SECRET',
    'DISCORD_CLIENT_ID',
    'DISCORD_CLIENT_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ]
  
  requiredVars.forEach(varName => {
    const value = process.env[varName]
    if (value) {
      console.log(`✅ ${varName}: ${varName.includes('SECRET') ? '[HIDDEN]' : value.substring(0, 20)}...`)
    } else {
      console.log(`❌ ${varName}: Missing`)
    }
  })
}

async function diagnoseIssue() {
  console.log('🔍 OAuth Callback Diagnosis\n')
  console.log('=' .repeat(50))
  
  // Check environment variables
  await checkEnvironmentVariables()
  
  // Check database
  const dbWorking = await checkDatabase()
  
  // Check auth endpoints
  await checkAuthEndpoints()
  
  // Test user creation
  if (dbWorking) {
    await simulateOAuthCallback()
  }
  
  console.log('\n📋 **DIAGNOSIS SUMMARY:**')
  console.log('=' .repeat(50))
  
  console.log('\n🎯 **Most Likely Issues:**')
  console.log('1. **Database connection failing in production**')
  console.log('   → Check Vercel environment variables')
  console.log('   → Verify DATABASE_URL is correct in Vercel')
  
  console.log('\n2. **NextAuth adapter issues**')
  console.log('   → PrismaAdapter might be failing to create users')
  console.log('   → Check Vercel function logs for Prisma errors')
  
  console.log('\n3. **OAuth callback URL mismatch**')
  console.log('   → Verify exact URLs in Discord/Google apps')
  console.log('   → Must be: https://www.swivimedia.com/api/auth/callback/discord')
  console.log('   → Must be: https://www.swivimedia.com/api/auth/callback/google')
  
  console.log('\n4. **Session/JWT configuration**')
  console.log('   → NextAuth might be failing to create sessions')
  console.log('   → Check NEXTAUTH_SECRET in Vercel')
  
  console.log('\n🔧 **IMMEDIATE ACTIONS:**')
  console.log('1. Check Vercel function logs during OAuth attempt')
  console.log('2. Verify all environment variables in Vercel match local')
  console.log('3. Test OAuth flow and watch browser network tab')
  console.log('4. Check Supabase logs for connection errors')
  
  console.log('\n📊 **How to Monitor:**')
  console.log('• Vercel Dashboard → Functions → View Logs')
  console.log('• Browser DevTools → Network tab during OAuth')
  console.log('• Supabase Dashboard → Logs')
  console.log('• Run this script after OAuth attempts to see if users are created')
}

diagnoseIssue().catch(console.error)
