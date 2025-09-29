#!/usr/bin/env node

/**
 * Production setup script for the Swivi clipping platform
 * This script helps deploy the view tracking system to production
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Configuration
const PROJECT_ROOT = process.cwd()
const NODE_ENV = process.env.NODE_ENV || 'production'

function checkEnvironment() {
  console.log('🔍 Checking environment configuration...')

  const requiredEnvVars = [
    'APIFY_API_KEY',
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar])

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:')
    missing.forEach(envVar => console.error(`   - ${envVar}`))
    console.error('\nPlease set these in your Vercel dashboard or .env file')
    return false
  }

  console.log('✅ All required environment variables are set')
  return true
}

function installDependencies() {
  console.log('📦 Installing production dependencies...')

  try {
    execSync('npm ci', { stdio: 'inherit', cwd: PROJECT_ROOT })
    console.log('✅ Dependencies installed successfully')
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message)
    return false
  }

  return true
}

function runDatabaseMigrations() {
  console.log('🗄️ Running database migrations...')

  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: PROJECT_ROOT })
    console.log('✅ Database migrations completed')
  } catch (error) {
    console.error('❌ Database migration failed:', error.message)
    return false
  }

  return true
}

function setupViewTracking() {
  console.log('🎯 Setting up multi-platform view tracking...')

  try {
    // Set up cron jobs
    execSync('node scripts/deploy-view-tracking.js setup', { stdio: 'inherit', cwd: PROJECT_ROOT })

    // Test the view tracking script
    console.log('🧪 Testing view tracking system...')
    execSync('node scripts/deploy-view-tracking.js test', { stdio: 'inherit', cwd: PROJECT_ROOT })

    console.log('✅ View tracking system deployed successfully')
  } catch (error) {
    console.error('❌ View tracking setup failed:', error.message)
    return false
  }

  return true
}

function buildProductionApp() {
  console.log('🏗️ Building production application...')

  try {
    execSync('npm run build', { stdio: 'inherit', cwd: PROJECT_ROOT })
    console.log('✅ Application built successfully')
  } catch (error) {
    console.error('❌ Build failed:', error.message)
    return false
  }

  return true
}

function showDeploymentSummary() {
  console.log('\n🎉 Production Setup Complete!')
  console.log('=' .repeat(50))
  console.log('📊 Your clipping platform is now live with:')
  console.log('   ✅ Multi-platform view tracking (TikTok, YouTube, X, Instagram)')
  console.log('   ✅ Real-time campaign management')
  console.log('   ✅ Automated cron jobs (every 30 minutes)')
  console.log('   ✅ Admin dashboard for submissions')
  console.log('   ✅ Live campaign statistics')
  console.log('')
  console.log('🌐 Access your platform:')
  console.log('   Admin Dashboard: /admin/campaigns')
  console.log('   Admin Submissions: /admin/submissions')
  console.log('   Clipper Campaigns: /clippers/campaigns')
  console.log('')
  console.log('🔧 Monitoring:')
  console.log('   Logs: /var/log/swivi-view-tracking.log')
  console.log('   Cron Status: node scripts/deploy-view-tracking.js status')
  console.log('   Manual Update: curl -X POST https://your-domain.com/api/view-tracking/update')
  console.log('')
  console.log('📈 Next Steps:')
  console.log('   1. Create test campaigns in the admin dashboard')
  console.log('   2. Monitor the logs for any issues')
  console.log('   3. Set up additional platform scrapers when you have the Apify actor details')
  console.log('   4. Configure payout automation')
}

function main() {
  console.log('🚀 Swivi Production Deployment')
  console.log('=' .repeat(50))

  const steps = [
    { name: 'Environment Check', fn: checkEnvironment },
    { name: 'Install Dependencies', fn: installDependencies },
    { name: 'Database Migration', fn: runDatabaseMigrations },
    { name: 'View Tracking Setup', fn: setupViewTracking },
    { name: 'Build Application', fn: buildProductionApp },
    { name: 'Deployment Summary', fn: showDeploymentSummary }
  ]

  let success = true

  for (const step of steps) {
    console.log(`\n📋 ${step.name}...`)
    try {
      if (!step.fn()) {
        success = false
        break
      }
    } catch (error) {
      console.error(`❌ ${step.name} failed:`, error.message)
      success = false
      break
    }
  }

  if (!success) {
    console.error('\n💥 Deployment failed! Please check the errors above.')
    process.exit(1)
  }

  console.log('\n✨ Deployment completed successfully!')
}

if (require.main === module) {
  main()
}
