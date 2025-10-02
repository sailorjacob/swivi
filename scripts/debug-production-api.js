#!/usr/bin/env node

/**
 * Debug script for production API issues
 * Run this to test the production admin API
 */

async function debugProductionAPI() {
  console.log('🔍 Production Admin API Debug')
  console.log('=============================')

  const baseUrl = 'https://www.swivimedia.com'

  try {
    console.log('\n1️⃣  Testing health endpoint...')
    const healthResponse = await fetch(`${baseUrl}/api/health`)
    console.log(`   Status: ${healthResponse.status}`)
    if (healthResponse.ok) {
      const healthData = await healthResponse.json()
      console.log(`   Database: ${healthData.database}`)
      console.log(`   Environment: ${healthData.environment}`)
    }

    console.log('\n2️⃣  Testing session endpoint...')
    const sessionResponse = await fetch(`${baseUrl}/api/auth/session`)
    console.log(`   Status: ${sessionResponse.status}`)
    const sessionData = await sessionResponse.json()
    console.log(`   Session: ${JSON.stringify(sessionData)}`)

    console.log('\n3️⃣  Testing admin API (should be 401)...')
    const adminResponse = await fetch(`${baseUrl}/api/admin/users`)
    console.log(`   Status: ${adminResponse.status}`)
    if (adminResponse.status === 500) {
      console.log('   ❌ Got 500 error - check Vercel logs for details')
    } else if (adminResponse.status === 401) {
      console.log('   ✅ Correctly returns 401 (unauthorized)')
    }

    const adminData = await adminResponse.json()
    console.log(`   Response: ${JSON.stringify(adminData)}`)

    console.log('\n4️⃣  Testing NextAuth providers...')
    const providersResponse = await fetch(`${baseUrl}/api/auth/providers`)
    console.log(`   Status: ${providersResponse.status}`)
    if (providersResponse.ok) {
      const providersData = await providersResponse.json()
      console.log(`   Providers: ${Object.keys(providersData).join(', ')}`)
    }

    console.log('\n📋 Summary:')
    console.log('- If health endpoint works: Database is connected')
    console.log('- If session is empty: User not authenticated')
    console.log('- If admin API returns 401: Working correctly (needs auth)')
    console.log('- If admin API returns 500: Check Vercel function logs')

  } catch (error) {
    console.error('❌ Debug script error:', error.message)
  }
}

debugProductionAPI().catch(console.error)
