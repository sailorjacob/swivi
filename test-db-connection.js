#!/usr/bin/env node

require('dotenv').config({ path: '.env' })

async function testDatabaseConnections() {
  console.log('🔍 COMPREHENSIVE DATABASE CONNECTION TEST')
  console.log('=======================================')

  // Test 1: Environment Variables
  console.log('\n1️⃣  Environment Variables Check:')
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`)
  console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`)
  console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`)
  console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}`)

  // Test 2: Prisma Connection (Primary Database)
  console.log('\n2️⃣  Prisma Database Connection (Primary):')
  try {
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    await prisma.$connect()
    console.log('   ✅ Prisma connected successfully')

    // Test basic queries
    const userCount = await prisma.user.count()
    const campaignCount = await prisma.campaign.count()
    const clipCount = await prisma.clip.count()

    console.log(`   📊 Database Records:`)
    console.log(`      Users: ${userCount}`)
    console.log(`      Campaigns: ${campaignCount}`)
    console.log(`      Clips: ${clipCount}`)

    // Test a simple query
    const users = await prisma.user.findMany({ take: 1 })
    if (users.length > 0) {
      console.log(`   ✅ Sample user query works: ${users[0].email || users[0].id}`)
    }

    await prisma.$disconnect()
  } catch (error) {
    console.log('   ❌ Prisma connection failed:', error.message)
  }

  // Test 3: Supabase Client (Secondary)
  console.log('\n3️⃣  Supabase Client Connection (Secondary):')
  try {
    const { createClient } = require('@supabase/supabase-js')

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('   ⚠️  Supabase credentials not configured')
    } else {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      // Test basic connection
      const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true })

      if (error) {
        console.log('   ❌ Supabase query failed:', error.message)
      } else {
        console.log('   ✅ Supabase connected successfully')
        console.log(`   📊 Users table accessible`)
      }
    }
  } catch (error) {
    console.log('   ❌ Supabase connection failed:', error.message)
  }

  // Test 4: Schema Validation
  console.log('\n4️⃣  Schema Validation:')
  try {
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    // Check if we can access all main tables
    const tables = ['user', 'campaign', 'clip', 'socialAccount', 'viewTracking']
    for (const table of tables) {
      try {
        const count = await prisma[table].count()
        console.log(`   ✅ ${table}: ${count} records`)
      } catch (error) {
        console.log(`   ⚠️  ${table}: Table might not exist (${error.message})`)
      }
    }

    await prisma.$disconnect()
  } catch (error) {
    console.log('   ❌ Schema validation failed:', error.message)
  }

  console.log('\n🎯 Summary:')
  console.log('   Primary DB (Prisma/PostgreSQL): Uses DATABASE_URL')
  console.log('   Secondary (Supabase Client): Uses NEXT_PUBLIC_SUPABASE_* variables')
  console.log('   File Storage: Uses Supabase storage buckets')
}

testDatabaseConnections().catch(console.error)
