#!/usr/bin/env node
/**
 * OAuth Debug Script
 * This helps debug OAuth issues step by step
 */

const https = require('https')

async function checkEndpoint(url) {
  return new Promise((resolve) => {
    const request = https.get(url, (response) => {
      let data = ''
      response.on('data', chunk => data += chunk)
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          resolve({
            status: response.statusCode,
            data: parsed,
            url: url
          })
        } catch (e) {
          resolve({
            status: response.statusCode,
            data: data,
            url: url
          })
        }
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

async function debugOAuth() {
  console.log('🔍 OAuth Debug Analysis...\n')
  
  // Check providers endpoint
  console.log('📡 Checking OAuth Providers:')
  const providersResult = await checkEndpoint('https://www.swivimedia.com/api/auth/providers')
  
  if (providersResult.status === 200 && providersResult.data) {
    console.log('✅ Providers endpoint working')
    
    if (providersResult.data.discord) {
      console.log('✅ Discord provider configured')
    } else {
      console.log('❌ Discord provider missing')
    }
    
    if (providersResult.data.google) {
      console.log('✅ Google provider configured') 
    } else {
      console.log('❌ Google provider missing')
    }
    
    console.log('\nAvailable providers:', Object.keys(providersResult.data))
  } else {
    console.log('❌ Providers endpoint failed:', providersResult.status)
  }
  
  // Check CSRF endpoint
  console.log('\n🔐 Checking CSRF:')
  const csrfResult = await checkEndpoint('https://www.swivimedia.com/api/auth/csrf')
  if (csrfResult.status === 200) {
    console.log('✅ CSRF endpoint working')
  } else {
    console.log('❌ CSRF endpoint failed:', csrfResult.status)
  }
  
  console.log('\n🚨 Common OAuth Issues:')
  console.log('1. **Callback URLs not added to OAuth providers**')
  console.log('   → This is the most common cause of signup → login redirect')
  console.log('   → Users get OAuth error and are sent back to login')
  
  console.log('\n2. **Environment variables missing in production**')
  console.log('   → Check Vercel environment variables')
  console.log('   → Make sure DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET exist')
  console.log('   → Make sure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET exist')
  
  console.log('\n3. **OAuth app not approved/published**')
  console.log('   → Discord: App must be public or user must be in server')
  console.log('   → Google: App must be in testing mode with test users added')
  
  console.log('\n📋 **REQUIRED ACTIONS:**')
  console.log('\n📘 Discord Setup:')
  console.log('1. Go to: https://discord.com/developers/applications')
  console.log('2. Select your app (or create new one)')
  console.log('3. OAuth2 → General → Redirects → Add:')
  console.log('   https://www.swivimedia.com/api/auth/callback/discord')
  console.log('4. OAuth2 → General → Make sure "Public Bot" is UNCHECKED')
  console.log('5. Copy Client ID and Secret to Vercel env vars')
  
  console.log('\n📗 Google Setup:')
  console.log('1. Go to: https://console.cloud.google.com/')
  console.log('2. Select project (or create new one)')
  console.log('3. APIs & Services → Credentials')
  console.log('4. Create OAuth 2.0 Client ID (Web application)')
  console.log('5. Authorized redirect URIs → Add:')
  console.log('   https://www.swivimedia.com/api/auth/callback/google')
  console.log('6. OAuth consent screen → Add test users (your email)')
  console.log('7. Copy Client ID and Secret to Vercel env vars')
  
  console.log('\n🧪 **Test Process:**')
  console.log('1. Add callback URLs to both providers')
  console.log('2. Wait 5-10 minutes for changes to propagate')
  console.log('3. Try signup again')
  console.log('4. Check Vercel function logs for errors')
  console.log('5. Check Supabase for new user creation')
  
  console.log('\n📊 **Monitor Success:**')
  console.log('• Vercel Logs: Look for "OAuth sign in attempt" messages')
  console.log('• Supabase: SELECT * FROM users ORDER BY created_at DESC;')
  console.log('• Success: User redirected to dashboard, not login page')
}

debugOAuth().catch(console.error)
