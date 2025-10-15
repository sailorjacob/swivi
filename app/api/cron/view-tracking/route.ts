import { NextRequest, NextResponse } from "next/server"
import { ViewTrackingService } from "@/lib/view-tracking"
import { prisma } from "@/lib/prisma"

// This endpoint should only be called by authorized services (cron jobs, etc.)
// In production, add proper authentication/authorization

export async function GET(request: NextRequest) {
  try {
    // Basic security check - only allow from authorized sources
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const apifyToken = process.env.APIFY_API_KEY

    if (!apifyToken) {
      return NextResponse.json(
        { error: "Apify API key not configured" },
        { status: 500 }
      )
    }

    const viewTrackingService = new ViewTrackingService(apifyToken)

    // Update view tracking for all platforms
    console.log('🚀 Starting automated view tracking update...')
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
      message: "View tracking updated successfully",
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
