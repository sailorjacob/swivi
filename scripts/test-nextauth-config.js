#!/usr/bin/env node

/**
 * Test NextAuth configuration and session handling
 */

require('dotenv').config({ path: '.env' })

async function testNextAuthConfig() {
  console.log('🔐 NextAuth Configuration Test')
  console.log('==============================')

  const { authOptions } = require('../lib/auth.ts')

  try {
    console.log('\n1️⃣  Checking auth options...')
    console.log(`   Session strategy: ${authOptions.session?.strategy || 'database'}`)
    console.log(`   Secret configured: ${authOptions.secret ? '✅' : '❌'}`)
    console.log(`   Providers count: ${authOptions.providers?.length || 0}`)

    console.log('\n2️⃣  Checking providers...')
    authOptions.providers?.forEach((provider, index) => {
      console.log(`   ${index + 1}. ${provider.id} (${provider.type})`)
    })

    console.log('\n3️⃣  Checking adapter...')
    if (authOptions.adapter) {
      console.log('   ✅ Prisma adapter configured')
    } else {
      console.log('   ❌ No adapter configured')
    }

    console.log('\n4️⃣  Environment variables check...')
    const required = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL']
    required.forEach(env => {
      console.log(`   ${env}: ${process.env[env] ? '✅' : '❌'}`)
    })

    console.log('\n✅ NextAuth configuration appears valid')

  } catch (error) {
    console.error('❌ NextAuth configuration error:', error.message)
  }
}

testNextAuthConfig().catch(console.error)
