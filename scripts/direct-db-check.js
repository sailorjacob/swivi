#!/usr/bin/env node

/**
 * Direct database check using raw queries to avoid Prisma issues
 */

require('dotenv').config({ path: '.env' })
const { Client } = require('pg')

async function checkDatabase() {
  let client

  try {
    console.log('🔍 Checking database directly...')

    // Connect using raw PostgreSQL client
    client = new Client({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 10000,
      query_timeout: 10000,
    })

    await client.connect()
    console.log('✅ Database connected successfully!')

    // Count users
    const userResult = await client.query('SELECT COUNT(*) as count FROM users')
    const userCount = parseInt(userResult.rows[0].count)
    console.log(`✅ Found ${userCount} users in database`)

    if (userCount > 0) {
      // Get recent users
      const usersResult = await client.query(`
        SELECT id, name, email, role, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 5
      `)

      console.log('✅ Recent users:')
      usersResult.rows.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name || 'No name'} (${user.email}) - ${user.role}`)
      })

      // Check admin count
      const adminResult = await client.query(`
        SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN'
      `)
      const adminCount = parseInt(adminResult.rows[0].count)

      if (adminCount === 0 && userCount > 0) {
        console.log('⚠️  No admin users found. Promoting first user to admin...')

        // Get first user ID
        const firstUserResult = await client.query(`
          SELECT id FROM users ORDER BY created_at ASC LIMIT 1
        `)
        const firstUserId = firstUserResult.rows[0].id

        // Update to admin
        await client.query(`
          UPDATE users SET role = 'ADMIN', updated_at = NOW() WHERE id = $1
        `, [firstUserId])

        console.log(`🎉 Successfully promoted user ${firstUserId} to admin`)
      } else {
        console.log(`✅ Found ${adminCount} admin user(s)`)
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.code) {
      console.error('Error code:', error.code)
    }
  } finally {
    if (client) {
      await client.end()
    }
  }
}

checkDatabase().catch(console.error)
