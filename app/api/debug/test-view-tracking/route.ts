import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { ViewTrackingService } from "@/lib/view-tracking-service"

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const userData = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id }
    })

    if (!userData || userData.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { clipId, action } = body

    if (!clipId) {
      return NextResponse.json({ error: "clipId is required" }, { status: 400 })
    }

    const viewTrackingService = new ViewTrackingService()

    if (action === "track_single") {
      // Track views for a single clip
      const result = await viewTrackingService.trackClipViews(clipId)

      return NextResponse.json({
        success: result.success,
        clipId: result.clipId,
        previousViews: result.previousViews,
        currentViews: result.currentViews,
        viewsGained: result.viewsGained,
        error: result.error
      })

    } else if (action === "process_all") {
      // Process view tracking for all active clips
      const result = await viewTrackingService.processViewTracking(50)

      return NextResponse.json({
        processed: result.processed,
        successful: result.successful,
        failed: result.failed,
        errors: result.errors
      })

    } else if (action === "get_stats") {
      // Get view stats for a specific clip
      const stats = await viewTrackingService.getClipViewStats(clipId)

      if (!stats) {
        return NextResponse.json({ error: "No view tracking data found for clip" }, { status: 404 })
      }

      return NextResponse.json(stats)

    } else if (action === "calculate_earnings") {
      // Calculate earnings for a clip
      const result = await viewTrackingService.calculateClipEarnings(clipId)

      return NextResponse.json({
        success: result.success,
        earnings: result.earnings,
        viewsGained: result.viewsGained,
        error: result.error
      })

    } else {
      return NextResponse.json({
        error: "Invalid action. Supported actions: track_single, process_all, get_stats, calculate_earnings"
      }, { status: 400 })
    }

  } catch (error) {
    console.error("Error in view tracking test:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET endpoint to show available test options
export async function GET() {
  return NextResponse.json({
    message: "View Tracking Test API",
    endpoints: {
      "POST /api/debug/test-view-tracking": {
        "track_single": "Track views for a specific clip",
        "process_all": "Process view tracking for all active clips",
        "get_stats": "Get view statistics for a clip",
        "calculate_earnings": "Calculate earnings for a clip"
      }
    },
    example_usage: {
      "Track single clip": {
        method: "POST",
        body: {
          clipId: "your-clip-id",
          action: "track_single"
        }
      },
      "Process all clips": {
        method: "POST",
        body: {
          action: "process_all"
        }
      },
      "Get clip stats": {
        method: "POST",
        body: {
          clipId: "your-clip-id",
          action: "get_stats"
        }
      },
      "Calculate earnings": {
        method: "POST",
        body: {
          clipId: "your-clip-id",
          action: "calculate_earnings"
        }
      }
    }
  })
}
