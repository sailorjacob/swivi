#!/usr/bin/env node

/**
 * Deployment script for setting up periodic view tracking updates
 * This sets up cron jobs to automatically update view counts
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Configuration
const SCRIPT_PATH = path.join(__dirname, 'update-view-tracking.js')
const LOG_FILE = '/var/log/swivi-view-tracking.log'
const CRON_SCHEDULE = '*/30 * * * *' // Every 30 minutes

function setupCronJob() {
  console.log('🔧 Setting up cron job for multi-platform view tracking...')

  try {
    // Create log file if it doesn't exist
    if (!fs.existsSync(LOG_FILE)) {
      fs.writeFileSync(LOG_FILE, '')
      console.log(`📝 Created log file: ${LOG_FILE}`)
    }

    // Check if cron job already exists
    const cronCheck = execSync('crontab -l 2>/dev/null || true', { encoding: 'utf8' })
    const hasExistingJob = cronCheck.includes('update-view-tracking') || cronCheck.includes('multi-platform')

    if (hasExistingJob) {
      console.log('✅ Cron job already exists')
      return
    }

    // Add new cron job
    const cronJob = `${CRON_SCHEDULE} cd ${process.cwd()} && node ${SCRIPT_PATH} >> ${LOG_FILE} 2>&1`
    const tempCronFile = '/tmp/crontab-temp'

    // Write current crontab + new job
    fs.writeFileSync(tempCronFile, cronCheck + cronJob + '\n')

    // Install new crontab
    execSync(`crontab ${tempCronFile}`)
    console.log('✅ Multi-platform cron job installed successfully')

    // Clean up
    fs.unlinkSync(tempCronFile)

  } catch (error) {
    console.error('❌ Failed to setup cron job:', error.message)
    process.exit(1)
  }
}

function setupLogRotation() {
  console.log('📋 Setting up log rotation...')

  try {
    // Create logrotate config
    const logrotateConfig = `
${LOG_FILE} {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
}
    `

    const logrotatePath = '/etc/logrotate.d/swivi-view-tracking'
    fs.writeFileSync(logrotatePath, logrotateConfig)
    console.log('✅ Log rotation configured')

  } catch (error) {
    console.error('❌ Failed to setup log rotation:', error.message)
    console.log('ℹ️  You may need to run this script with sudo for log rotation setup')
  }
}

function showStatus() {
  console.log('📊 Current cron jobs:')
  try {
    const cronJobs = execSync('crontab -l', { encoding: 'utf8' })
    console.log(cronJobs)
  } catch (error) {
    console.log('No cron jobs found')
  }
}

function main() {
  const command = process.argv[2]

  switch (command) {
    case 'setup':
      setupCronJob()
      setupLogRotation()
      break

    case 'status':
      showStatus()
      break

    case 'test':
      console.log('🧪 Testing view tracking script...')
      require('./update-view-tracking')
      break

    default:
      console.log(`
🚀 Swivi View Tracking Deployment Tool

Usage:
  node scripts/deploy-view-tracking.js <command>

Commands:
  setup     Set up cron job and log rotation
  status    Show current cron jobs
  test      Test the view tracking script

Examples:
  node scripts/deploy-view-tracking.js setup
  node scripts/deploy-view-tracking.js status
  node scripts/deploy-view-tracking.js test
      `)
  }
}

if (require.main === module) {
  main()
}
