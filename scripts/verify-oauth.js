#!/usr/bin/env node
/**
 * OAuth Setup Verification Script
 * This helps verify your OAuth providers are configured correctly
 */

const https = require('https')

const PRODUCTION_URL = 'https://www.swivimedia.com'
const LOCAL_URL = 'http://localhost:3000'

async function checkEndpoint(url) {
  return new Promise((resolve) => {
    const request = https.get(url, (response) => {
      resolve({
        status: response.statusCode,
        headers: response.headers,
        url: url
      })
    })
    
    request.on('error', (error) => {
      resolve({
        status: 'ERROR',
        error: error.message,
        url: url
      })
    })
    
    request.setTimeout(5000, () => {
      request.destroy()
      resolve({
        status: 'TIMEOUT',
        error: 'Request timeout',
        url: url
      })
    })
  })
}

async function verifyOAuthSetup() {
  console.log('🔍 Verifying OAuth Setup...\n')
  
  // Check NextAuth endpoints
  const endpoints = [
    `${PRODUCTION_URL}/api/auth/providers`,
    `${PRODUCTION_URL}/api/auth/csrf`,
    `${PRODUCTION_URL}/api/health`
  ]
  
  console.log('📡 Checking NextAuth Endpoints:')
  for (const endpoint of endpoints) {
    const result = await checkEndpoint(endpoint)
    const status = result.status === 200 ? '✅' : '❌'
    console.log(`${status} ${endpoint} - ${result.status}`)
  }
  
  console.log('\n🔗 Required OAuth Callback URLs:')
  console.log('Add these URLs to your OAuth providers:\n')
  
  console.log('📘 Discord Developer Portal:')
  console.log('   https://discord.com/developers/applications')
  console.log('   → Your App → OAuth2 → General → Redirects')
  console.log(`   ✓ ${PRODUCTION_URL}/api/auth/callback/discord`)
  console.log(`   ✓ ${LOCAL_URL}/api/auth/callback/discord`)
  
  console.log('\n📗 Google Cloud Console:')
  console.log('   https://console.cloud.google.com/')
  console.log('   → APIs & Services → Credentials → OAuth 2.0 Client')
  console.log(`   ✓ ${PRODUCTION_URL}/api/auth/callback/google`)
  console.log(`   ✓ ${LOCAL_URL}/api/auth/callback/google`)
  
  console.log('\n🧪 Test Your Setup:')
  console.log(`1. Go to: ${PRODUCTION_URL}/clippers/signup`)
  console.log('2. Try signing up with Discord')
  console.log('3. Try signing up with Google')
  console.log('4. Check Supabase for new users')
  
  console.log('\n📊 Monitor in Supabase:')
  console.log('   → Table Editor → users table')
  console.log('   → SQL Editor → SELECT * FROM users ORDER BY created_at DESC;')
  
  console.log('\n🔍 Debug in Vercel:')
  console.log('   → Dashboard → Functions → View Logs')
  console.log('   → Look for "OAuth sign in attempt" messages')
}

verifyOAuthSetup().catch(console.error)
