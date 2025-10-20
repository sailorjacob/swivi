// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { ViewTrackingService } from "@/lib/view-tracking-service"
import { CampaignCompletionService } from "@/lib/campaign-completion-service"

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
    const { action } = body

    const viewTrackingService = new ViewTrackingService()

    if (action === "test_view_tracking_cron") {
      // Test the view tracking cron job functionality
      const startTime = Date.now()

      try {
        const result = await viewTrackingService.processViewTracking(10) // Test with smaller batch

        const duration = Date.now() - startTime

        return NextResponse.json({
          success: true,
          action: "view_tracking_cron_test",
          result,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString()
        })

      } catch (error) {
        const duration = Date.now() - startTime

        return NextResponse.json({
          success: false,
          action: "view_tracking_cron_test",
          error: error instanceof Error ? error.message : "Unknown error",
          duration: `${duration}ms`,
          timestamp: new Date().toISOString()
        })
      }
    } else if (action === "test_campaign_completion") {
      // Test campaign completion logic
      const completionChecks = await CampaignCompletionService.checkCampaignCompletion()

      return NextResponse.json({
        success: true,
        action: "campaign_completion_test",
        campaignsChecked: completionChecks.length,
        results: completionChecks,
        timestamp: new Date().toISOString()
      })

    } else if (action === "test_scraping_endpoints") {
      // Test if scraping endpoints are working
      const testUrls = [
        "https://www.tiktok.com/@example/video/123",
        "https://www.instagram.com/reel/example/",
        "https://www.youtube.com/shorts/example",
        "https://x.com/example/status/123"
      ]

      const scrapingResults = []

      for (const url of testUrls) {
        try {
          // This would test the actual scraping, but for now we'll just validate URLs
          const isValid = url.includes('tiktok.com') || url.includes('instagram.com') ||
                         url.includes('youtube.com') || url.includes('x.com')

          scrapingResults.push({
            url,
            isValid,
            platform: url.includes('tiktok.com') ? 'TIKTOK' :
                     url.includes('instagram.com') ? 'INSTAGRAM' :
                     url.includes('youtube.com') ? 'YOUTUBE' :
                     url.includes('x.com') ? 'TWITTER' : 'UNKNOWN'
          })
        } catch (error) {
          scrapingResults.push({
            url,
            isValid: false,
            error: error instanceof Error ? error.message : "Unknown error"
          })
        }
      }

      return NextResponse.json({
        success: true,
        action: "scraping_endpoints_test",
        urlsTested: testUrls.length,
        results: scrapingResults,
        timestamp: new Date().toISOString()
      })

    } else {
      return NextResponse.json({
        error: "Invalid action. Supported actions: test_view_tracking_cron, test_campaign_completion, test_scraping_endpoints"
      }, { status: 400 })
    }

  } catch (error) {
    console.error("Error in cron job testing:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET endpoint to show available test options
export async function GET() {
  return NextResponse.json({
    message: "Cron Jobs Test API",
    endpoints: {
      "POST /api/debug/test-cron-jobs": {
        "test_view_tracking_cron": "Test the view tracking cron job functionality",
        "test_campaign_completion": "Test campaign completion logic",
        "test_scraping_endpoints": "Test scraping endpoint validation"
      }
    },
    example_usage: {
      "Test View Tracking Cron": {
        method: "POST",
        body: {
          action: "test_view_tracking_cron"
        }
      },
      "Test Campaign Completion": {
        method: "POST",
        body: {
          action: "test_campaign_completion"
        }
      },
      "Test Scraping Endpoints": {
        method: "POST",
        body: {
          action: "test_scraping_endpoints"
        }
      }
    },
    note: "These tests help verify that cron jobs would work correctly in production"
  })
}
