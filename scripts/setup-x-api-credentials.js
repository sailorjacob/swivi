#!/usr/bin/env node

/**
 * Script to set up X API credentials in .env.local
 * Run this script to configure your X API credentials
 */

const fs = require('fs')
const path = require('path')

const credentials = {
  X_API_KEY: 'ikkoq6Ht6K4NRS45eCNxwXKmJ',
  X_API_SECRET: 'lMUfYBh8EDyhdY4XUGq1x6h4Ty5pNtk03iwgR9LeWjJmmgchIO',
  X_ACCESS_TOKEN: '1874248691021979648-XK1EZAUqYNxko4jymAaZfjB5nazChS',
  X_ACCESS_TOKEN_SECRET: 'LxZd55harlB2hdvnHNCPCOHTcqv6an7QhB5v1UQUAM7PF',
  X_BEARER_TOKEN: 'AAAAAAAAAAAAAAAAAAAAAIFi4wEAAAAAYwTgxEK9jJgrPcyPtvNM9%2FGoJT4%3D1QeciJS6zGOqGaFpkiQsnIUVEsyz2VvOD6wxalKF92ltRAJ1Pi'
}

function setupCredentials() {
  const envPath = path.join(process.cwd(), '.env.local')
  
  console.log('🔧 Setting up X API credentials...')
  
  let envContent = ''
  
  // Read existing .env.local if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8')
    console.log('📄 Found existing .env.local file')
  } else {
    console.log('📄 Creating new .env.local file')
  }
  
  // Add or update X API credentials
  const credentialEntries = Object.entries(credentials)
  let updatedContent = envContent
  
  for (const [key, value] of credentialEntries) {
    const regex = new RegExp(`^${key}=.*$`, 'm')
    const newLine = `${key}="${value}"`
    
    if (regex.test(updatedContent)) {
      // Update existing entry
      updatedContent = updatedContent.replace(regex, newLine)
      console.log(`✅ Updated ${key}`)
    } else {
      // Add new entry
      if (updatedContent && !updatedContent.endsWith('\n')) {
        updatedContent += '\n'
      }
      updatedContent += newLine + '\n'
      console.log(`➕ Added ${key}`)
    }
  }
  
  // Add CRON_SECRET if not present
  const cronSecretRegex = /^CRON_SECRET=.*$/m
  if (!cronSecretRegex.test(updatedContent)) {
    const cronSecret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    updatedContent += `CRON_SECRET="${cronSecret}"\n`
    console.log('🔐 Added CRON_SECRET for secure cron job authentication')
  }
  
  // Write the updated content
  fs.writeFileSync(envPath, updatedContent)
  
  console.log('✅ X API credentials have been set up successfully!')
  console.log('📝 Credentials written to .env.local')
  console.log('')
  console.log('🧪 You can now test the X API connection by running:')
  console.log('   curl http://localhost:3000/api/debug/test-x-api')
  console.log('')
  console.log('🚀 To start the development server:')
  console.log('   npm run dev')
  console.log('')
  console.log('⚠️  Make sure to restart your development server to load the new environment variables!')
}

// Run the setup
try {
  setupCredentials()
} catch (error) {
  console.error('❌ Error setting up X API credentials:', error.message)
  process.exit(1)
}
