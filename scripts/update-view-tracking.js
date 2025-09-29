#!/usr/bin/env node

/**
 * Script to periodically update view tracking for all TikTok submissions
 * This should be run as a cron job or scheduled task
 *
 * Usage:
 * node scripts/update-view-tracking.js
 *
 * Environment variables required:
 * - APIFY_API_KEY: Your Apify API token
 * - DATABASE_URL: Your database connection string
 */

const { ViewTrackingService } = require('../lib/view-tracking')

async function updateAllViewTracking() {
  console.log('🚀 Starting view tracking update...')

  try {
    // Check for required environment variables
    const apifyToken = process.env.APIFY_API_KEY
    if (!apifyToken) {
      throw new Error('APIFY_API_KEY environment variable is required')
    }

    const viewTrackingService = new ViewTrackingService(apifyToken)

    console.log('📊 Fetching submissions from all platforms to track...')
    await viewTrackingService.updateAllPlatformViews()

    console.log('✅ View tracking update completed successfully')

  } catch (error) {
    console.error('❌ Error updating view tracking:', error.message)
    process.exit(1)
  }
}

// Run the update if this script is executed directly
if (require.main === module) {
  updateAllViewTracking()
    .then(() => {
      console.log('🎉 Update process finished')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error)
      process.exit(1)
    })
}

module.exports = { updateAllViewTracking }
