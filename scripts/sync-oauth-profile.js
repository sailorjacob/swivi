#!/usr/bin/env node

/**
 * Script to retroactively sync OAuth profile data for existing users
 * This will update your current user account with Discord profile data
 */

const { createClient } = require('@supabase/supabase-js')
const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Admin key needed to fetch user data
const prisma = new PrismaClient()

async function syncOAuthProfile() {
  try {
    console.log('🔍 Starting OAuth profile sync...')
    
    // Reset database connection to avoid prepared statement conflicts
    await prisma.$disconnect()
    await prisma.$connect()
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials. Check SUPABASE_SERVICE_ROLE_KEY in .env')
    }

    // Create admin Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Find your user in the database (by email)
    const targetEmail = 'x2sides@gmail.com' // Your email
    console.log(`🔍 Looking for user with email: ${targetEmail}`)

    const dbUser = await prisma.user.findUnique({
      where: { email: targetEmail },
      select: {
        id: true,
        supabaseAuthId: true,
        name: true,
        image: true,
        email: true
      }
    })

    if (!dbUser) {
      console.log('❌ User not found in database')
      return
    }

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

    // Check if we should update (only if current data is missing or generic)
    const shouldUpdateName = !dbUser.name || 
                            dbUser.name === 'New User' || 
                            dbUser.name === 'Clipper' ||
                            dbUser.name === targetEmail.split('@')[0]

    const shouldUpdateImage = !dbUser.image

    if (!shouldUpdateName && !shouldUpdateImage) {
      console.log('✅ Profile already has good data, no update needed')
      return
    }

    // Prepare update data
    const updateData = {}
    if (shouldUpdateName && oauthName) {
      updateData.name = oauthName
      console.log(`📝 Will update name: "${dbUser.name}" → "${oauthName}"`)
    }
    if (shouldUpdateImage && oauthImage) {
      updateData.image = oauthImage
      console.log(`📝 Will update image: "${dbUser.image}" → "${oauthImage}"`)
    }

    if (Object.keys(updateData).length === 0) {
      console.log('⚠️ No OAuth data available to sync')
      return
    }

    // Update the database
    console.log('💾 Updating database...')
    const updatedUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        image: true,
        email: true
      }
    })

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
    await prisma.$disconnect()
  }
}

// Run the sync
syncOAuthProfile()
