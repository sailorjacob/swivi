#!/usr/bin/env node

/**
 * Setup script for automated view tracking cron job
 *
 * This script helps configure automated view tracking to run periodically.
 * It can be used with various cron services like:
 * - Vercel Cron (recommended for Vercel deployments)
 * - GitHub Actions
 * - External cron services
 * - Self-hosted cron jobs
 */

const fs = require('fs')
const path = require('path')

// Configuration
const CRON_SCHEDULES = {
  // Run every 4 hours during business hours (more frequent for active campaigns)
  frequent: '0 */4 * * *', // Every 4 hours
  // Run every hour (for very active campaigns)
  hourly: '0 * * * *', // Every hour
  // Run every 30 minutes (for testing/high-frequency updates)
  testing: '*/30 * * * *', // Every 30 minutes
  // Run twice daily (for less active campaigns)
  daily: '0 9,21 * * *', // 9 AM and 9 PM
}

function generateCronSecret() {
  return require('crypto').randomBytes(32).toString('hex')
}

function createVercelCronConfig(schedule = 'frequent') {
  const cronSecret = generateCronSecret()

  const config = {
    crons: [
      {
        path: '/api/cron/view-tracking',
        schedule: CRON_SCHEDULES[schedule],
        headers: {
          'Authorization': `Bearer ${cronSecret}`
        }
      },
      {
        path: '/api/cron/payout-calculation',
        schedule: CRON_SCHEDULES[schedule],
        headers: {
          'Authorization': `Bearer ${cronSecret}`
        }
      }
    ]
  }

  return { config, cronSecret }
}

function createGitHubActionsWorkflow(schedule = 'frequent') {
  const workflow = {
    name: 'Automated Platform Updates',
    on: {
      schedule: [
        {
          cron: CRON_SCHEDULES[schedule]
        }
      ],
      workflow_dispatch: null // Allow manual trigger
    },
    jobs: {
      'platform-updates': {
        'runs-on': 'ubuntu-latest',
        steps: [
          {
            name: 'Run View Tracking Update',
            run: `curl -X GET "${process.env.VITE_APP_URL || 'http://localhost:3000'}/api/cron/view-tracking" -H "Authorization: Bearer ${process.env.CRON_SECRET}"`
          },
          {
            name: 'Run Payout Calculation',
            run: `curl -X GET "${process.env.VITE_APP_URL || 'http://localhost:3000'}/api/cron/payout-calculation" -H "Authorization: Bearer ${process.env.CRON_SECRET}"`
          }
        ]
      }
    }
  }

  return workflow
}

function setupEnvironmentVariables() {
  const envExamplePath = path.join(process.cwd(), '.env.example')
  const envPath = path.join(process.cwd(), '.env')

  let envContent = ''

  if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, 'utf8')
  }

  // Add or update cron secret
  const cronSecret = generateCronSecret()
  const cronSecretLine = `CRON_SECRET=${cronSecret}`

  if (envContent.includes('CRON_SECRET=')) {
    envContent = envContent.replace(/CRON_SECRET=.*/, cronSecretLine)
  } else {
    envContent += `\n${cronSecretLine}`
  }

  fs.writeFileSync(envPath, envContent)
  console.log('✅ Updated .env file with CRON_SECRET')

  return cronSecret
}

function printSetupInstructions() {
  console.log('\n📋 Automated View Tracking Setup Instructions')
  console.log('=' .repeat(50))

  console.log('\n1. Choose your deployment platform:')

  console.log('\n🔹 Vercel (Recommended):')
  console.log('   - Create vercel.json in your project root')
  console.log('   - Add the cron configuration from createVercelCronConfig()')
  console.log('   - Deploy to Vercel (crons are handled automatically)')

  console.log('\n🔹 GitHub Actions:')
  console.log('   - Create .github/workflows/view-tracking.yml')
  console.log('   - Add the workflow from createGitHubActionsWorkflow()')
  console.log('   - Set CRON_SECRET as a repository secret')

  console.log('\n🔹 External Cron Service:')
  console.log('   - Use services like cron-job.org, easy-cron.com, etc.')
  console.log('   - Set up HTTP GET request to your deployed endpoint')
  console.log('   - Include Authorization header with CRON_SECRET')

  console.log('\n2. Environment Variables:')
  console.log('   - CRON_SECRET: Used for endpoint authentication')
  console.log('   - APIFY_API_KEY: Required for view scraping')
  console.log('   - DATABASE_URL: PostgreSQL connection string')

  console.log('\n3. Monitoring:')
  console.log('   - Check logs for "View tracking update completed" messages')
  console.log('   - Monitor API endpoint response times')
  console.log('   - Set up alerts for failed runs')

  console.log('\n4. Schedule Recommendations:')
  console.log('   - Testing: Every 30 minutes')
  console.log('   - Active campaigns: Every 4 hours')
  console.log('   - Normal operation: Every 12 hours')
  console.log('   - Low activity: Daily')
}

function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'help'

  switch (command) {
    case 'setup-env':
      const cronSecret = setupEnvironmentVariables()
      console.log(`\n🔑 Generated CRON_SECRET: ${cronSecret}`)
      break

    case 'vercel-config':
      const schedule = args[1] || 'frequent'
      const { config, cronSecret: secret } = createVercelCronConfig(schedule)
      console.log('\n📄 Vercel Configuration (vercel.json):')
      console.log(JSON.stringify(config, null, 2))
      console.log(`\n🔑 CRON_SECRET: ${secret}`)
      break

    case 'github-workflow':
      const ghSchedule = args[1] || 'frequent'
      const workflow = createGitHubActionsWorkflow(ghSchedule)
      console.log('\n📄 GitHub Actions Workflow (.github/workflows/view-tracking.yml):')
      console.log(JSON.stringify(workflow, null, 2))
      break

    case 'help':
    default:
      printSetupInstructions()
      break
  }
}

if (require.main === module) {
  main()
}

module.exports = {
  CRON_SCHEDULES,
  createVercelCronConfig,
  createGitHubActionsWorkflow,
  setupEnvironmentVariables
}
