#!/usr/bin/env node

/**
 * Test script to verify X API integration
 * Run this after setting up credentials to test the connection
 */

const { spawn } = require('child_process')
const path = require('path')

async function testXApiIntegration() {
  console.log('🧪 Testing X API Integration...')
  console.log('')
  
  // Test 1: Check if environment variables are set
  console.log('1️⃣ Checking environment variables...')
  
  const requiredEnvVars = [
    'X_API_KEY',
    'X_API_SECRET', 
    'X_ACCESS_TOKEN',
    'X_ACCESS_TOKEN_SECRET',
    'X_BEARER_TOKEN'
  ]
  
  const envPath = path.join(process.cwd(), '.env.local')
  const fs = require('fs')
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file not found')
    console.log('   Run: node scripts/setup-x-api-credentials.js')
    return
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8')
  const missingVars = requiredEnvVars.filter(varName => {
    const regex = new RegExp(`^${varName}=`, 'm')
    return !regex.test(envContent)
  })
  
  if (missingVars.length > 0) {
    console.log('❌ Missing environment variables:', missingVars.join(', '))
    console.log('   Run: node scripts/setup-x-api-credentials.js')
    return
  }
  
  console.log('✅ All environment variables are set')
  console.log('')
  
  // Test 2: Check if dependencies are installed
  console.log('2️⃣ Checking dependencies...')
  
  const packageJsonPath = path.join(process.cwd(), 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    console.log('❌ package.json not found')
    return
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  const hasDependency = packageJson.dependencies && packageJson.dependencies['twitter-api-v2']
  
  if (!hasDependency) {
    console.log('❌ twitter-api-v2 dependency not found')
    console.log('   Run: npm install twitter-api-v2')
    return
  }
  
  console.log('✅ Dependencies are installed')
  console.log('')
  
  // Test 3: Start development server and test API
  console.log('3️⃣ Testing API endpoints...')
  console.log('   Starting development server...')
  console.log('   (This will take a moment)')
  console.log('')
  
  const server = spawn('npm', ['run', 'dev'], {
    stdio: 'pipe',
    cwd: process.cwd()
  })
  
  let serverReady = false
  
  // Wait for server to start
  server.stdout.on('data', (data) => {
    const output = data.toString()
    if (output.includes('Ready') || output.includes('localhost:3000')) {
      serverReady = true
    }
  })
  
  // Wait for server to be ready
  await new Promise((resolve) => {
    const checkReady = () => {
      if (serverReady) {
        resolve()
      } else {
        setTimeout(checkReady, 1000)
      }
    }
    checkReady()
  })
  
  // Give it a bit more time to fully initialize
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  try {
    // Test X API connection
    console.log('   Testing X API connection...')
    
    const response = await fetch('http://localhost:3000/api/debug/test-x-api')
    const result = await response.json()
    
    if (result.success) {
      console.log('✅ X API connection successful!')
      if (result.rateLimits) {
        console.log('   Rate limits available')
      }
    } else {
      console.log('❌ X API connection failed:', result.error)
      console.log('   Message:', result.message)
    }
    
  } catch (error) {
    console.log('❌ Error testing API:', error.message)
  }
  
  // Clean up
  server.kill()
  
  console.log('')
  console.log('🎉 X API integration test completed!')
  console.log('')
  console.log('📋 Next steps:')
  console.log('   1. Start your development server: npm run dev')
  console.log('   2. Test with a real tweet: POST /api/debug/test-x-api with {"tweetUrl": "..."}')
  console.log('   3. Run the view tracking cron: GET /api/cron/view-tracking')
  console.log('')
}

// Add fetch polyfill for Node.js
if (!global.fetch) {
  const { default: fetch } = require('node-fetch')
  global.fetch = fetch
}

testXApiIntegration().catch(console.error)
