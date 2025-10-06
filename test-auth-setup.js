#!/usr/bin/env node

require('dotenv').config({ path: '.env' })

async function testAuthSetup() {
  console.log('🔐 Authentication Setup Test')
  console.log('===========================')

  // Test 1: Environment variables
  console.log('\n1️⃣  Environment Variables Check:')
  const envVars = {
    'DATABASE_URL': process.env.DATABASE_URL,
    'NEXTAUTH_SECRET': process.env.NEXTAUTH_SECRET,
    'NEXTAUTH_URL': process.env.NEXTAUTH_URL,
    'DISCORD_CLIENT_ID': process.env.DISCORD_CLIENT_ID,
    'DISCORD_CLIENT_SECRET': process.env.DISCORD_CLIENT_SECRET
  }

  Object.entries(envVars).forEach(([key, value]) => {
    const status = value && value !== 'YOUR_' + key + '_HERE' ? '✅' : '❌'
    console.log(`   ${key}: ${status} ${value ? '(configured)' : '(missing)'}`)
  })

  // Test 2: Database connection
  console.log('\n2️⃣  Database Connection Test:')
  try {
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    await prisma.$connect()
    console.log('   ✅ Database connected successfully')

    const userCount = await prisma.user.count()
    console.log(`   📊 Found ${userCount} users in database`)

    await prisma.$disconnect()
  } catch (error) {
    console.log('   ❌ Database connection failed:', error.message)
  }

  // Test 3: Discord OAuth URLs
  console.log('\n3️⃣  Discord OAuth Configuration:')
  if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
    console.log('   ✅ Discord OAuth credentials configured')
    console.log('   🔗 Callback URLs should be set in Discord Developer Portal:')
    console.log('      https://swivimedia.com/api/auth/callback/discord')
    console.log('      http://localhost:3000/api/auth/callback/discord')
  } else {
    console.log('   ❌ Discord OAuth credentials missing')
  }

  // Test 4: NextAuth URL configuration
  console.log('\n4️⃣  NextAuth URL Configuration:')
  if (process.env.NEXTAUTH_URL) {
    console.log(`   ✅ NEXTAUTH_URL: ${process.env.NEXTAUTH_URL}`)
  } else {
    console.log('   ❌ NEXTAUTH_URL not configured')
  }

  console.log('\n🎯 Summary:')
  console.log('   If all checks pass, Discord authentication should work!')
  console.log('   Make sure Discord OAuth redirect URLs are configured in Discord Developer Portal')
}

testAuthSetup().catch(console.error)
