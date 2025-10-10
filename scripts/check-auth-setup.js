#!/usr/bin/env node

/**
 * Authentication Setup Verification Script
 * Checks if Supabase Auth is properly configured and working
 */

const https = require('https')

async function checkAuthSetup() {
  console.log('🔍 Checking Authentication Setup...\n')

  // Check environment variables
  console.log('📋 Environment Variables Check:')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing')
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing')

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('\n❌ Missing required Supabase environment variables!')
    console.log('Please set these in your .env file or Vercel dashboard:')
    console.log('NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co')
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key')
    return
  }

  console.log('\n✅ Basic environment variables are set')

  // Check Supabase connection
  console.log('\n🔗 Testing Supabase Connection...')
  try {
    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Test basic connection
    const { data, error } = await supabase.from('_supabase_tables').select('count').limit(1)

    if (error) {
      console.log('❌ Supabase connection failed:', error.message)
    } else {
      console.log('✅ Supabase connection successful')
    }
  } catch (error) {
    console.log('❌ Error testing Supabase connection:', error.message)
  }

  console.log('\n📊 Next Steps:')
  console.log('1. Ensure Discord OAuth is configured in Supabase Dashboard')
  console.log('2. Verify redirect URLs match your domain')
  console.log('3. Check that cookies are being set properly after login')
  console.log('4. Test the authentication flow manually')

  console.log('\n🔧 If still having issues:')
  console.log('- Check browser console for cookie-related errors')
  console.log('- Verify Supabase Auth settings in dashboard')
  console.log('- Ensure your domain is properly configured')
}

checkAuthSetup().catch(console.error)





