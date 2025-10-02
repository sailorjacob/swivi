#!/usr/bin/env node

/**
 * Test the admin users API endpoint
 */

require('dotenv').config({ path: '.env' })

async function testAdminAPI() {
  try {
    console.log('🔍 Testing admin users API...')

    const fetch = (await import('node-fetch')).default

    // Test without authentication first
    const response1 = await fetch('http://localhost:3000/api/admin/users')
    console.log(`❌ Without auth: ${response1.status} ${response1.statusText}`)

    if (response1.status === 401) {
      console.log('✅ Authentication correctly required for admin API')
    }

    // Test with wrong role (simulate a clipper trying to access)
    // This would require a valid session token for a non-admin user
    console.log('ℹ️  To fully test admin API, you need to:')
    console.log('   1. Log in as an admin user through the web interface')
    console.log('   2. Check browser developer tools for the session cookie')
    console.log('   3. Use that cookie in the API request')

    console.log('\n📍 Admin users page should be accessible at:')
    console.log('   http://localhost:3000/admin/users')

  } catch (error) {
    console.error('❌ Error testing API:', error.message)
  }
}

testAdminAPI().catch(console.error)
