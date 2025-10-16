import { NextRequest, NextResponse } from "next/server"
import { ViewTrackingService } from "@/lib/view-tracking-service"
import { CampaignCompletionService } from "@/lib/campaign-completion-service"
import { prisma } from "@/lib/prisma"

// This endpoint should only be called by authorized services (cron jobs, etc.)
// In production, add proper authentication/authorization

export async function GET(request: NextRequest) {
  try {
    // Security check for Vercel cron jobs
    // Vercel cron jobs come from specific IPs/user agents
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

    // Initialize the view tracking service
    const viewTrackingService = new ViewTrackingService()

    // Update view tracking for active campaigns only
    console.log('🚀 Starting automated view tracking update for active campaigns...')
    const startTime = Date.now()

    const result = await viewTrackingService.processViewTracking(50) // Process up to 50 clips per cron run

    const duration = Date.now() - startTime
    console.log(`✅ View tracking update completed in ${duration}ms - Processed: ${result.processed}, Successful: ${result.successful}, Failed: ${result.failed}`)

    // Check for campaigns that should be completed
    console.log('🔍 Checking for campaigns that should be completed...')
    const completionStartTime = Date.now()

    const completionResult = await CampaignCompletionService.autoCompleteCampaigns()

    const completionDuration = Date.now() - completionStartTime
    console.log(`✅ Campaign completion check completed in ${completionDuration}ms - Completed: ${completionResult.completed}, Skipped: ${completionResult.skipped}`)

    if (completionResult.errors.length > 0) {
      console.warn('⚠️ Campaign completion errors:', completionResult.errors)
    }

    // Log the update for monitoring
    await prisma.viewTracking.create({
      data: {
        userId: 'system',
        clipId: 'system',
        views: 0,
        date: new Date(),
        platform: 'TIKTOK'
      }
    }).catch(() => {
      // Ignore duplicate key errors for system tracking
    })

    return NextResponse.json({
      success: true,
      message: "View tracking and campaign completion check completed successfully",
      viewTracking: {
        duration: `${duration}ms`,
        processed: result.processed,
        successful: result.successful,
        failed: result.failed,
        errors: result.errors
      },
      campaignCompletion: {
        duration: `${completionDuration}ms`,
        completed: completionResult.completed,
        skipped: completionResult.skipped,
        errors: completionResult.errors
      }
    })

  } catch (error) {
    console.error("Error in automated view tracking:", error)

    return NextResponse.json(
      { error: "Failed to update view tracking" },
      { status: 500 }
    )
  }
}

// Health check endpoint for cron monitoring
export async function HEAD() {
  return new Response(null, { status: 200 })
}
