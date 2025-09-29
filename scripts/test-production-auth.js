#!/usr/bin/env node
/**
 * Test Production Authentication
 * This simulates what happens during OAuth flow
 */

const https = require('https')

async function makeRequest(url, options = {}) {
  return new Promise((resolve) => {
    const request = https.request(url, options, (response) => {
      let data = ''
      response.on('data', chunk => data += chunk)
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          resolve({
            status: response.statusCode,
            headers: response.headers,
            data: parsed,
            url: url
          })
        } catch (e) {
          resolve({
            status: response.statusCode,
            headers: response.headers,
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
    
    request.setTimeout(10000, () => {
      request.destroy()
      resolve({
        status: 'TIMEOUT',
        error: 'Request timeout',
        url: url
      })
    })
    
    if (options.method === 'POST' && options.body) {
      request.write(options.body)
    }
    
    request.end()
  })
}

async function testProductionAuth() {
  console.log('🔍 Testing Production Authentication Flow...\n')
  
  const baseUrl = 'https://www.swivimedia.com'
  
  // Test 1: Check providers
  console.log('1️⃣ Testing OAuth Providers:')
  const providers = await makeRequest(`${baseUrl}/api/auth/providers`)
  
  if (providers.status === 200) {
    console.log('✅ Providers endpoint working')
    console.log('Available providers:', Object.keys(providers.data))
    
    // Check if Discord and Google are properly configured
    if (providers.data.discord) {
      console.log('✅ Discord provider found')
      console.log('   ID:', providers.data.discord.id)
      console.log('   Name:', providers.data.discord.name)
    }
    
    if (providers.data.google) {
      console.log('✅ Google provider found')
      console.log('   ID:', providers.data.google.id) 
      console.log('   Name:', providers.data.google.name)
    }
  } else {
    console.log('❌ Providers endpoint failed:', providers.status)
    return
  }
  
  // Test 2: Check CSRF
  console.log('\n2️⃣ Testing CSRF Token:')
  const csrf = await makeRequest(`${baseUrl}/api/auth/csrf`)
  
  if (csrf.status === 200) {
    console.log('✅ CSRF endpoint working')
    console.log('CSRF Token available:', !!csrf.data.csrfToken)
  } else {
    console.log('❌ CSRF endpoint failed:', csrf.status)
  }
  
  // Test 3: Test OAuth redirect URLs
  console.log('\n3️⃣ Testing OAuth Redirect URLs:')
  
  const discordUrl = `${baseUrl}/api/auth/signin/discord`
  const googleUrl = `${baseUrl}/api/auth/signin/google`
  
  console.log('Discord signin URL:', discordUrl)
  console.log('Google signin URL:', googleUrl)
  
  // Test if these URLs are accessible (should redirect to OAuth providers)
  const discordTest = await makeRequest(discordUrl)
  const googleTest = await makeRequest(googleUrl)
  
  console.log('Discord signin response:', discordTest.status)
  console.log('Google signin response:', googleTest.status)
  
  // Test 4: Check callback URLs
  console.log('\n4️⃣ Testing Callback URLs:')
  
  const discordCallback = `${baseUrl}/api/auth/callback/discord`
  const googleCallback = `${baseUrl}/api/auth/callback/google`
  
  console.log('Discord callback URL:', discordCallback)
  console.log('Google callback URL:', googleCallback)
  
  // These should return some response (not 404)
  const discordCallbackTest = await makeRequest(discordCallback)
  const googleCallbackTest = await makeRequest(googleCallback)
  
  console.log('Discord callback status:', discordCallbackTest.status)
  console.log('Google callback status:', googleCallbackTest.status)
  
  console.log('\n📋 **Diagnosis:**')
  
  if (providers.status === 200 && csrf.status === 200) {
    console.log('✅ NextAuth is working correctly')
    console.log('✅ OAuth providers are configured')
    
    if (discordTest.status >= 300 && discordTest.status < 400) {
      console.log('✅ Discord OAuth redirect working')
    } else {
      console.log('⚠️  Discord OAuth redirect issue:', discordTest.status)
    }
    
    if (googleTest.status >= 300 && googleTest.status < 400) {
      console.log('✅ Google OAuth redirect working')
    } else {
      console.log('⚠️  Google OAuth redirect issue:', googleTest.status)
    }
    
    console.log('\n🎯 **Most Likely Issues:**')
    console.log('1. OAuth consent screen not properly configured')
    console.log('2. Test users not added to Google OAuth app')
    console.log('3. Discord app not public or user not in allowed list')
    console.log('4. Environment variables mismatch between local and Vercel')
    console.log('5. Database connection failing during user creation')
    
  } else {
    console.log('❌ NextAuth configuration issue')
  }
  
  console.log('\n🔧 **Next Steps:**')
  console.log('1. Try OAuth signup and check browser developer console for errors')
  console.log('2. Check Vercel function logs during OAuth attempt')
  console.log('3. Verify OAuth consent screens are properly configured')
  console.log('4. Make sure you are added as test user in Google OAuth')
}

testProductionAuth().catch(console.error)
