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

      // Find or create a test campaign for this platform
      let testCampaign = await prisma.campaign.findFirst({
        where: {
          title: { contains: 'Test Campaign' },
          status: 'ACTIVE',
          targetPlatforms: { has: platform }
        }
      })

      if (!testCampaign) {
        testCampaign = await prisma.campaign.create({
          data: {
            title: `Test Campaign - ${platform}`,
            description: `Test campaign for ${platform} view tracking and earnings`,
            creator: 'Test System',
            budget: 1000.00, // $1000 test budget
            payoutRate: 25.00, // $25 per 1000 views
            spent: 0,
            status: 'ACTIVE',
            startDate: new Date(),
            targetPlatforms: [platform],
            requirements: ['Test requirement']
          }
        })
      }

      // Create a test clip with submission
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

      // Create submission for the clip (PENDING by default - mirrors production flow)
      const submission = await prisma.clipSubmission.create({
        data: {
          userId: userData.id,
          campaignId: testCampaign.id,
          clipId: testClip.id,
          clipUrl: url,
          platform: platform,
          status: 'PENDING', // Start as pending
          initialViews: 0 // Will be set on approval
        }
      })

      return NextResponse.json({
        success: true,
        clipId: testClip.id,
        submissionId: submission.id,
        campaignId: testCampaign.id,
        message: "Test clip and submission created successfully. Use 'approve_submission' to approve it.",
        clip: {
          id: testClip.id,
          url: testClip.url,
          platform: testClip.platform,
          title: testClip.title
        },
        submission: {
          id: submission.id,
          status: submission.status,
          campaignTitle: testCampaign.title
        }
      })

    } else if (action === "approve_submission") {
      const { submissionId } = body

      if (!submissionId) {
        return NextResponse.json({ error: "submissionId is required" }, { status: 400 })
      }

      // Get submission with clip
      const submission = await prisma.clipSubmission.findUnique({
        where: { id: submissionId },
        include: { clips: true }
      })

      if (!submission) {
        return NextResponse.json({ error: "Submission not found" }, { status: 404 })
      }

      // Scrape current views to set as initialViews
      const viewTrackingService = new ViewTrackingService()
      let initialViews = 0

      if (submission.clips) {
        try {
          const scraper = new (await import('@/lib/multi-platform-scraper')).MultiPlatformScraper(process.env.APIFY_TOKEN || '')
          const scrapedData = await scraper.scrapeContent(submission.clips.url, submission.clips.platform)
          initialViews = scrapedData.views || 0
        } catch (error) {
          console.error('Error scraping initial views:', error)
        }
      }

      // Approve submission and set initialViews
      const updatedSubmission = await prisma.clipSubmission.update({
        where: { id: submissionId },
        data: {
          status: 'APPROVED',
          initialViews: BigInt(initialViews)
        }
      })

      return NextResponse.json({
        success: true,
        submissionId: submissionId,
        status: updatedSubmission.status,
        initialViews: initialViews,
        message: `Submission approved with ${initialViews} initial views. Earnings will now accumulate as views grow.`
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
      // List all test clips and submissions for the user
      const testSubmissions = await prisma.clipSubmission.findMany({
        where: {
          userId: userData.id,
          campaigns: {
            title: { contains: 'Test Campaign' }
          }
        },
        include: {
          clips: {
            include: {
              view_tracking: {
                orderBy: { date: 'desc' },
                take: 1
              }
            }
          },
          campaigns: {
            select: {
              id: true,
              title: true,
              budget: true,
              spent: true,
              payoutRate: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json({
        success: true,
        submissions: testSubmissions.map(submission => ({
          id: submission.id,
          status: submission.status,
          initialViews: Number(submission.initialViews || 0),
          finalEarnings: Number(submission.finalEarnings || 0),
          clip: submission.clips ? {
            id: submission.clips.id,
            url: submission.clips.url,
            platform: submission.clips.platform,
            title: submission.clips.title,
            totalViews: Number(submission.clips.views || 0),
            earnings: Number(submission.clips.earnings || 0),
            latestTracking: submission.clips.view_tracking[0] ? {
              date: submission.clips.view_tracking[0].date,
              views: Number(submission.clips.view_tracking[0].views)
            } : null
          } : null,
          campaign: {
            id: submission.campaigns.id,
            title: submission.campaigns.title,
            budget: Number(submission.campaigns.budget),
            spent: Number(submission.campaigns.spent || 0),
            payoutRate: Number(submission.campaigns.payoutRate),
            status: submission.campaigns.status
          },
          createdAt: submission.createdAt
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
        error: "Invalid action. Supported actions: submit_url, approve_submission, track_views, get_tracking_history, list_test_clips, delete_test_clip, test_cron_job, calculate_earnings"
      }, { status: 400 })
    }

  } catch (error) {
    console.error("Error in test view tracking:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

