#!/usr/bin/env node

require('dotenv').config({ path: '.env' })

async function testProductionSetup() {
  console.log('🚀 PRODUCTION SETUP TEST')
  console.log('=======================')

  // 1. Check environment variables
  console.log('\n1️⃣  Environment Variables:')
  const required = ['DATABASE_URL', 'NEXTAUTH_URL', 'DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET']
  required.forEach(env => {
    const value = process.env[env]
    const status = value ? '✅' : '❌'
    console.log(`   ${env}: ${status} ${value ? '(configured)' : '(missing)'}`)
  })

  // 2. Check DATABASE_URL format
  console.log('\n2️⃣  DATABASE_URL Analysis:')
  const dbUrl = process.env.DATABASE_URL
  if (dbUrl) {
    if (dbUrl.includes('.pooler.supabase.com')) {
      console.log('   ✅ Using Supabase connection pooler URL (Vercel compatible)')
    } else if (dbUrl.includes('db.') && dbUrl.includes('.supabase.co')) {
      console.log('   ⚠️  Using direct database URL (not Vercel compatible)')
      console.log('   🔧 Fix: Enable Supabase connection pooling and use pooled URL')
    } else {
      console.log('   ❌ Invalid DATABASE_URL format')
    }
  }

  // 3. Check NEXTAUTH_URL
  console.log('\n3️⃣  NEXTAUTH_URL Check:')
  const nextauthUrl = process.env.NEXTAUTH_URL
  if (nextauthUrl === 'https://swivimedia.com') {
    console.log('   ✅ Correct production URL')
  } else if (nextauthUrl === 'http://localhost:3000') {
    console.log('   ⚠️  Using localhost URL (development only)')
  } else {
    console.log(`   ❌ Invalid NEXTAUTH_URL: ${nextauthUrl}`)
  }

  // 4. Database connection test
  console.log('\n4️⃣  Database Connection Test:')
  try {
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    await prisma.$connect()
    console.log('   ✅ Database connected successfully')

    const userCount = await prisma.user.count()
    console.log(`   📊 Users in database: ${userCount}`)

    await prisma.$disconnect()
  } catch (error) {
    console.log('   ❌ Database connection failed:', error.message)
  }

  // 5. Production readiness summary
  console.log('\n5️⃣  Production Readiness Summary:')
  const issues = []

  if (!dbUrl?.includes('.pooler.supabase.com')) {
    issues.push('❌ DATABASE_URL needs to be Supabase pooler URL for Vercel')
  }

  if (nextauthUrl !== 'https://swivimedia.com') {
    issues.push('❌ NEXTAUTH_URL should be https://swivimedia.com for production')
  }

  if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET) {
    issues.push('❌ Discord OAuth credentials missing')
  }

  if (issues.length === 0) {
    console.log('   ✅ All production requirements met!')
  } else {
    console.log('   ❌ Issues found:')
    issues.forEach(issue => console.log(`      ${issue}`))
  }

  console.log('\n🎯 Next Steps:')
  if (issues.some(i => i.includes('DATABASE_URL'))) {
    console.log('   1. Enable Supabase connection pooling')
    console.log('   2. Update Vercel DATABASE_URL with pooled URL')
  }
  if (issues.some(i => i.includes('Discord'))) {
    console.log('   3. Verify Discord OAuth credentials in Vercel')
  }
  console.log('   4. Redeploy to Vercel')
  console.log('   5. Test: https://swivimedia.com/clippers/login')
}

testProductionSetup().catch(console.error)
