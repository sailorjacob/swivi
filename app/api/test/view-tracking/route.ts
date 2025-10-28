// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { ViewTrackingService } from "@/lib/view-tracking-service"
import { trackViews } from "@/lib/database-utils"

// Create a test clip for tracking
export async function POST(request: NextRequest) {
  try {
    // Allow testing without authentication in development
    const isDev = process.env.NODE_ENV === 'development'
    
    const { user, error } = await getServerUserWithRole(request)

    // In development, create a test user if not authenticated
    let userData = null
    
    if (!user?.id || error) {
      if (!isDev) {
        return NextResponse.json({ error: "Unauthorized - Please login first" }, { status: 401 })
      }
      
      // In dev mode, use or create a test user
      userData = await prisma.user.findFirst({
        where: { email: { contains: 'test' } }
      })
      
      if (!userData) {
        // Create a temporary test user for development
        userData = await prisma.user.create({
          data: {
            supabaseAuthId: 'test-user-' + Date.now(),
            email: 'test@example.com',
            name: 'Test User',
            role: 'CLIPPER'
          }
        })
      }
    } else {
      // Check if user is admin or clipper
      userData = await prisma.user.findUnique({
        where: { supabaseAuthId: user.id }
      })

      if (!userData || (userData.role !== "ADMIN" && userData.role !== "CLIPPER")) {
        return NextResponse.json({ error: "Admin or Clipper access required" }, { status: 403 })
      }
    }

    const body = await request.json()
    const { url, platform, action } = body

    if (action === "submit_url") {
      // Validate URL and platform
      if (!url || !platform) {
        return NextResponse.json({ error: "URL and platform are required" }, { status: 400 })
      }

      const validPlatforms = ['TIKTOK', 'YOUTUBE', 'INSTAGRAM', 'TWITTER']
      if (!validPlatforms.includes(platform)) {
        return NextResponse.json({ error: "Invalid platform. Supported: TIKTOK, YOUTUBE, INSTAGRAM, TWITTER" }, { status: 400 })
      }

      // Create a test clip for tracking
      const testClip = await prisma.clip.create({
        data: {
          userId: userData.id,
          url: url,
          platform: platform,
          title: `Test Clip - ${platform} - ${new Date().toISOString()}`,
          description: `Test clip created for view tracking testing on ${platform}`,
          status: 'ACTIVE'
        }
      })

      return NextResponse.json({
        success: true,
        clipId: testClip.id,
        message: "Test clip created successfully",
        clip: {
          id: testClip.id,
          url: testClip.url,
          platform: testClip.platform,
          title: testClip.title
        }
      })

    } else if (action === "track_views") {
      const { clipId } = body

      if (!clipId) {
        return NextResponse.json({ error: "clipId is required" }, { status: 400 })
      }

      // Check if clip exists and belongs to user or user is admin
      const clip = await prisma.clip.findUnique({
        where: { id: clipId },
        include: {
          view_tracking: {
            orderBy: { date: 'desc' },
            take: 10
          }
        }
      })

      if (!clip) {
        return NextResponse.json({ error: "Clip not found" }, { status: 404 })
      }

      // Allow if user owns the clip or is admin
      if (clip.userId !== userData.id && userData.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized to access this clip" }, { status: 403 })
      }

      // Use the view tracking service to update views
      const viewTrackingService = new ViewTrackingService()
      const result = await viewTrackingService.trackClipViews(clipId)

      if (!result.success) {
        return NextResponse.json({
          success: false,
          error: result.error
        })
      }

      // Get updated tracking data
      const updatedClip = await prisma.clip.findUnique({
        where: { id: clipId },
        include: {
          view_tracking: {
            orderBy: { date: 'desc' },
            take: 10
          }
        }
      })

      return NextResponse.json({
        success: true,
        clipId: clipId,
        previousViews: result.previousViews,
        currentViews: result.currentViews,
        viewsGained: result.viewsGained,
        trackingHistory: updatedClip?.view_tracking.map(t => ({
          date: t.date,
          views: Number(t.views)
        })) || []
      })

    } else if (action === "get_tracking_history") {
      const { clipId } = body

      if (!clipId) {
        return NextResponse.json({ error: "clipId is required" }, { status: 400 })
      }

      // Get tracking history for a clip
      const clip = await prisma.clip.findUnique({
        where: { id: clipId },
        include: {
          view_tracking: {
            orderBy: { date: 'desc' },
            take: 30
          },
          users: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      if (!clip) {
        return NextResponse.json({ error: "Clip not found" }, { status: 404 })
      }

      // Allow if user owns the clip or is admin
      if (clip.userId !== userData.id && userData.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized to access this clip" }, { status: 403 })
      }

      // Calculate stats
      const trackingData = clip.view_tracking
      const totalViews = Number(clip.views)
      const viewsToday = trackingData.find(t => t.date.toDateString() === new Date().toDateString())?.views || 0
      const viewsYesterday = trackingData.find(t => t.date.toDateString() === new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString())?.views || 0

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const viewsThisWeek = trackingData
        .filter(t => t.date >= weekAgo)
        .reduce((sum, t) => sum + Number(t.views), 0)

      const averageDailyViews = trackingData.length > 0
        ? trackingData.reduce((sum, t) => sum + Number(t.views), 0) / trackingData.length
        : 0

      return NextResponse.json({
        success: true,
        clip: {
          id: clip.id,
          url: clip.url,
          platform: clip.platform,
          title: clip.title,
          totalViews: totalViews,
          user: clip.users
        },
        stats: {
          totalViews: totalViews,
          viewsToday: Number(viewsToday),
          viewsYesterday: Number(viewsYesterday),
          viewsThisWeek: viewsThisWeek,
          averageDailyViews: Math.round(averageDailyViews * 100) / 100,
          daysTracked: trackingData.length
        },
        trackingHistory: trackingData.map(t => ({
          date: t.date,
          views: Number(t.views)
        }))
      })

    } else if (action === "list_test_clips") {
      // List all test clips for the user
      const testClips = await prisma.clip.findMany({
        where: {
          userId: userData.id,
          title: {
            contains: "Test Clip"
          }
        },
        include: {
          view_tracking: {
            orderBy: { date: 'desc' },
            take: 1
          },
          users: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json({
        success: true,
        clips: testClips.map(clip => ({
          id: clip.id,
          url: clip.url,
          platform: clip.platform,
          title: clip.title,
          totalViews: Number(clip.views),
          latestTracking: clip.view_tracking[0] ? {
            date: clip.view_tracking[0].date,
            views: Number(clip.view_tracking[0].views)
          } : null,
          createdAt: clip.createdAt
        }))
      })

    } else if (action === "delete_test_clip") {
      const { clipId } = body

      if (!clipId) {
        return NextResponse.json({ error: "clipId is required" }, { status: 400 })
      }

      // Check if clip exists and belongs to user
      const clip = await prisma.clip.findUnique({
        where: { id: clipId }
      })

      if (!clip) {
        return NextResponse.json({ error: "Clip not found" }, { status: 404 })
      }

      // Allow if user owns the clip or is admin
      if (clip.userId !== userData.id && userData.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized to delete this clip" }, { status: 403 })
      }

      // Only allow deletion of test clips
      if (!clip.title.includes("Test Clip")) {
        return NextResponse.json({ error: "Can only delete test clips" }, { status: 400 })
      }

      // Delete the clip (this will cascade delete view tracking due to schema constraints)
      await prisma.clip.delete({
        where: { id: clipId }
      })

      return NextResponse.json({
        success: true,
        message: "Test clip deleted successfully"
      })

    } else if (action === "test_cron_job") {
      // Manually trigger the cron job functionality for testing
      const viewTrackingService = new ViewTrackingService()
      const result = await viewTrackingService.processViewTracking(50)

      // Also test campaign completion
      const { CampaignCompletionService } = await import("@/lib/campaign-completion-service")
      const completionResult = await CampaignCompletionService.autoCompleteCampaigns()

      return NextResponse.json({
        success: true,
        message: "Cron job test completed",
        viewTracking: {
          processed: result.processed,
          successful: result.successful,
          failed: result.failed,
          errors: result.errors
        },
        campaignCompletion: {
          completed: completionResult.completed,
          skipped: completionResult.skipped,
          errors: completionResult.errors
        }
      })

    } else if (action === "calculate_earnings") {
      const { clipId } = body

      if (!clipId) {
        return NextResponse.json({ error: "clipId is required" }, { status: 400 })
      }

      // Check if clip exists and belongs to user
      const clip = await prisma.clip.findUnique({
        where: { id: clipId },
        include: {
          view_tracking: {
            orderBy: { date: 'asc' }
          }
        }
      })

      if (!clip) {
        return NextResponse.json({ error: "Clip not found" }, { status: 404 })
      }

      // Allow if user owns the clip or is admin
      if (clip.userId !== userData.id && userData.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized to access this clip" }, { status: 403 })
      }

      // Calculate earnings based on view growth
      const trackingData = clip.view_tracking
      if (trackingData.length < 2) {
        return NextResponse.json({
          success: true,
          earnings: 0,
          viewsGained: 0,
          message: "Need at least 2 tracking records to calculate earnings"
        })
      }

      // Calculate total views gained
      const firstViews = Number(trackingData[0].views)
      const lastViews = Number(trackingData[trackingData.length - 1].views)
      const viewsGained = lastViews - firstViews

      // Simple earnings calculation (example rate: $0.01 per 1000 views)
      const earningsRate = 0.01 / 1000 // $0.01 per 1000 views
      const earnings = viewsGained * earningsRate

      return NextResponse.json({
        success: true,
        earnings: Math.round(earnings * 100) / 100,
        viewsGained: viewsGained,
        calculation: {
          firstViews: firstViews,
          lastViews: lastViews,
          rate: "$0.01 per 1000 views",
          trackingDays: trackingData.length
        }
      })

    } else {
      return NextResponse.json({
        error: "Invalid action. Supported actions: submit_url, track_views, get_tracking_history, list_test_clips, delete_test_clip, test_cron_job, calculate_earnings"
      }, { status: 400 })
    }

  } catch (error) {
    console.error("Error in test view tracking:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

