#!/usr/bin/env node

/**
 * Test script to verify admin users functionality
 * Run this after completing the OAuth login flow
 */

require('dotenv').config({ path: '.env' })

async function testAdminFlow() {
  console.log('🔐 Admin Users Functionality Test')
  console.log('=================================')

  console.log('\n📋 Current Database State:')
  const { Client } = require('pg')
  const client = new Client({ connectionString: process.env.DATABASE_URL })

  try {
    await client.connect()

    // Get role counts
    const result = await client.query(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
      ORDER BY role
    `)

    console.log('User roles in database:')
    result.rows.forEach(row => {
      console.log(`  ${row.role}: ${row.count}`)
    })

    const totalResult = await client.query('SELECT COUNT(*) as total FROM users')
    console.log(`Total users: ${totalResult.rows[0].total}`)

  } catch (error) {
    console.log('❌ Database error:', error.message)
  } finally {
    await client.end()
  }

  console.log('\n✅ Expected Frontend Behavior:')
  console.log('- Total Users card should show: 5')
  console.log('- Admins card should show: 2')
  console.log('- Creators card should show: 0 (no CREATOR role users)')
  console.log('- Clippers card should show: 3')

  console.log('\n🔧 If you see incorrect counts:')
  console.log('1. Make sure you completed OAuth login (Discord/Google)')
  console.log('2. Check browser console for API errors')
  console.log('3. Try refreshing the admin page')
  console.log('4. Check if session cookies are set in browser dev tools')

  console.log('\n📍 Test URLs:')
  console.log('- Login: http://localhost:3000/clippers/login')
  console.log('- Admin: http://localhost:3000/admin/users')
  console.log('- API: http://localhost:3000/api/admin/users')
}

testAdminFlow().catch(console.error)
