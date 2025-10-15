import { NextRequest, NextResponse } from "next/server"
import { XViewTrackingService } from "@/lib/x-view-tracking"
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

    const apifyToken = process.env.APIFY_API_KEY
    
    // X API credentials are handled internally by XViewTrackingService
    const viewTrackingService = new XViewTrackingService(apifyToken)

    // Update view tracking for active campaigns only
    console.log('🚀 Starting automated view tracking update for active campaigns...')
    const startTime = Date.now()

    await viewTrackingService.updateAllPlatformViews()

    const duration = Date.now() - startTime
    console.log(`✅ View tracking update completed in ${duration}ms`)

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
      message: "View tracking updated successfully for active campaigns",
      duration: `${duration}ms`
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
