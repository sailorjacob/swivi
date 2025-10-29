// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { ViewTrackingService } from "@/lib/view-tracking-service"

// This endpoint is called by Vercel Cron Jobs every 4 hours
// It handles: view tracking → earnings calculation → budget updates → campaign completion

export async function GET(request: NextRequest) {
  try {
    // Security check for Vercel cron jobs
    const userAgent = request.headers.get('user-agent') || ''
    const isVercelCron = userAgent.includes('Vercel-Cron') || userAgent.includes('vercel-cron')

    // For development/testing, allow if no cron secret is set
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get('authorization')

    // Allow if: it's a Vercel cron job, or has valid auth header, or no secret is configured (dev mode)
    if (!isVercelCron && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log('🚀 Starting integrated view tracking and earnings calculation...')
    const startTime = Date.now()

    // Initialize the view tracking service
    const viewTrackingService = new ViewTrackingService()

    // Process view tracking with integrated earnings calculation
    // This will:
    // 1. Scrape views for active clips (in smaller batches for Apify)
    // 2. Calculate earnings from view growth
    // 3. Update clip, user, and campaign earnings
    // 4. Check budget limits and complete campaigns if needed
    // 5. Send notifications when campaigns complete
    // 6. Handle large campaigns (>100 clips) by processing them alone
    const result = await viewTrackingService.processViewTracking(100, 5)

    const duration = Date.now() - startTime

    console.log(`✅ View tracking completed in ${duration}ms`)
    console.log(`   Processed: ${result.processed}`)
    console.log(`   Successful: ${result.successful}`)
    console.log(`   Failed: ${result.failed}`)
    console.log(`   Earnings Added: $${result.totalEarningsAdded.toFixed(2)}`)
    
    if (result.campaignsCompleted.length > 0) {
      console.log(`   Campaigns Completed: ${result.campaignsCompleted.length}`)
    }

    if (result.errors.length > 0) {
      console.warn('⚠️ Errors during tracking:', result.errors)
    }

    return NextResponse.json({
      success: true,
      message: "View tracking and earnings calculation completed successfully",
      duration: `${duration}ms`,
      stats: {
        processed: result.processed,
        successful: result.successful,
        failed: result.failed,
        earningsAdded: `$${result.totalEarningsAdded.toFixed(2)}`,
        campaignsCompleted: result.campaignsCompleted.length
      },
      errors: result.errors.length > 0 ? result.errors : undefined
    })

  } catch (error) {
    console.error("❌ Error in view tracking cron job:", error)

    return NextResponse.json(
      { 
        error: "Failed to update view tracking",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Health check endpoint for cron monitoring
export async function HEAD() {
  return new Response(null, { status: 200 })
}
