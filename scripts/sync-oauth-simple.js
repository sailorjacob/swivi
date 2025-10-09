#!/usr/bin/env node

/**
 * Simple script to sync OAuth profile data using direct database connection
 */

const { createClient } = require('@supabase/supabase-js')
const { Client } = require('pg')
require('dotenv').config()

async function syncOAuthProfile() {
  let pgClient
  
  try {
    console.log('🔍 Starting OAuth profile sync...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const databaseUrl = process.env.DATABASE_URL
    
    if (!supabaseUrl || !supabaseServiceKey || !databaseUrl) {
      throw new Error('Missing required environment variables')
    }

    // Create direct PostgreSQL connection
    pgClient = new Client({ connectionString: databaseUrl })
    await pgClient.connect()
    console.log('✅ Connected to database')

    // Create admin Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Find your user in the database
    const targetEmail = 'x2sides@gmail.com'
    console.log(`🔍 Looking for user with email: ${targetEmail}`)

    const userQuery = 'SELECT id, "supabaseAuthId", name, image, email FROM users WHERE email = $1'
    const userResult = await pgClient.query(userQuery, [targetEmail])

    if (userResult.rows.length === 0) {
      console.log('❌ User not found in database')
      return
    }

    const dbUser = userResult.rows[0]
    console.log('✅ Found user in database:', {
      id: dbUser.id,
      supabaseAuthId: dbUser.supabaseAuthId,
      currentName: dbUser.name,
      currentImage: dbUser.image
    })

    // Get OAuth data from Supabase Auth
    console.log('🔍 Fetching OAuth data from Supabase Auth...')
    const { data: authUser, error } = await supabase.auth.admin.getUserById(dbUser.supabaseAuthId)

    if (error || !authUser.user) {
      console.log('❌ Failed to fetch OAuth data:', error?.message)
      return
    }

    console.log('✅ Found OAuth data:', {
      email: authUser.user.email,
      userMetadata: authUser.user.user_metadata,
      rawUserMetadata: authUser.user.raw_user_meta_data
    })

    // Extract profile data from OAuth
    const oauthName = authUser.user.user_metadata?.full_name ||
                     authUser.user.user_metadata?.name ||
                     authUser.user.raw_user_meta_data?.full_name ||
                     authUser.user.raw_user_meta_data?.name

    const oauthImage = authUser.user.user_metadata?.avatar_url ||
                      authUser.user.user_metadata?.picture ||
                      authUser.user.raw_user_meta_data?.avatar_url ||
                      authUser.user.raw_user_meta_data?.picture

    console.log('📝 Extracted OAuth profile data:', {
      name: oauthName,
      image: oauthImage
    })

    // Check if we should update
    const shouldUpdateName = !dbUser.name || 
                            dbUser.name === 'New User' || 
                            dbUser.name === 'Clipper' ||
                            dbUser.name === targetEmail.split('@')[0]

    const shouldUpdateImage = !dbUser.image

    if (!shouldUpdateName && !shouldUpdateImage) {
      console.log('✅ Profile already has good data, no update needed')
      return
    }

    // Prepare update
    const updates = []
    const values = []
    let paramCount = 1

    if (shouldUpdateName && oauthName) {
      updates.push(`name = $${paramCount}`)
      values.push(oauthName)
      paramCount++
      console.log(`📝 Will update name: "${dbUser.name}" → "${oauthName}"`)
    }

    if (shouldUpdateImage && oauthImage) {
      updates.push(`image = $${paramCount}`)
      values.push(oauthImage)
      paramCount++
      console.log(`📝 Will update image: "${dbUser.image}" → "${oauthImage}"`)
    }

    if (updates.length === 0) {
      console.log('⚠️ No OAuth data available to sync')
      return
    }

    // Add updated timestamp
    updates.push(`"updatedAt" = NOW()`)
    values.push(dbUser.id)

    // Update the database
    const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}`
    console.log('💾 Updating database...')
    
    await pgClient.query(updateQuery, values)

    // Fetch updated user
    const updatedResult = await pgClient.query(
      'SELECT id, name, image, email FROM users WHERE id = $1',
      [dbUser.id]
    )
    const updatedUser = updatedResult.rows[0]

    console.log('🎉 Profile updated successfully!', {
      id: updatedUser.id,
      name: updatedUser.name,
      image: updatedUser.image,
      email: updatedUser.email
    })

    console.log('\n✅ OAuth profile sync completed!')
    console.log('💡 Refresh your dashboard to see the updated profile')

  } catch (error) {
    console.error('❌ Error syncing OAuth profile:', error)
  } finally {
    if (pgClient) {
      await pgClient.end()
    }
  }
}

// Run the sync
syncOAuthProfile()
