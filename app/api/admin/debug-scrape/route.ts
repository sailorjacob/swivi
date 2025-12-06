// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"

/**
 * Debug endpoint to test what Apify returns for a specific URL
 * Also shows database records for comparison
 * 
 * GET /api/admin/debug-scrape?url=<instagram-url>
 */
export async function GET(request: NextRequest) {
  try {
    // Admin check
    const { user, error } = await getServerUserWithRole(request)
    if (!user || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { role: true }
    })

    if (dbUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get URL from query params
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json({ error: "URL parameter required" }, { status: 400 })
    }

    // 1. Find this URL in our database
    const submission = await prisma.clipSubmission.findFirst({
      where: { clipUrl: { contains: url.split('?')[0] } }, // Strip query params
      include: {
        clips: {
          include: {
            view_tracking: {
              orderBy: { scrapedAt: 'desc' },
              take: 10
            }
          }
        },
        campaigns: {
          select: { title: true, payoutRate: true }
        }
      }
    })

    // 2. Scrape fresh data from Apify
    const apifyKey = process.env.APIFY_API_KEY
    if (!apifyKey) {
      return NextResponse.json({ error: "APIFY_API_KEY not configured" }, { status: 500 })
    }

    console.log(`🔍 Debug scrape for: ${url}`)

    // Call Apify Instagram scraper
    const runResponse = await fetch(`https://api.apify.com/v2/acts/apify~instagram-scraper/runs?waitForFinish=60`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apifyKey}`,
      },
      body: JSON.stringify({
        addParentData: false,
        directUrls: [url],
        enhanceUserSearchWithFacebookPage: false,
        isUserReelFeedURL: false,
        isUserTaggedFeedURL: false,
        resultsLimit: 200,
        resultsType: "posts",
        searchLimit: 1,
        searchType: "hashtag"
      }),
    })

    let apifyRawData: any = null
    let apifyError: string | null = null

    if (runResponse.ok) {
      const runData = await runResponse.json()
      
      if (runData.data.status === 'SUCCEEDED') {
        // Fetch the dataset
        const datasetResponse = await fetch(
          `https://api.apify.com/v2/datasets/${runData.data.defaultDatasetId}/items`,
          { headers: { 'Authorization': `Bearer ${apifyKey}` } }
        )
        
        if (datasetResponse.ok) {
          const items = await datasetResponse.json()
          apifyRawData = items[0] || null
        } else {
          apifyError = `Failed to fetch dataset: ${datasetResponse.status}`
        }
      } else {
        apifyError = `Apify run status: ${runData.data.status} - ${runData.data.errorMessage || ''}`
      }
    } else {
      apifyError = `Apify API error: ${runResponse.status}`
    }

    // 3. Build response with all diagnostic info
    const response = {
      url,
      timestamp: new Date().toISOString(),
      
      // What's in our database
      database: submission ? {
        submissionId: submission.id,
        clipId: submission.clipId,
        status: submission.status,
        initialViews: Number(submission.initialViews || 0),
        currentClipViews: submission.clips ? Number(submission.clips.views || 0) : null,
        clipEarnings: submission.clips ? Number(submission.clips.earnings || 0) : null,
        campaign: submission.campaigns.title,
        payoutRate: Number(submission.campaigns.payoutRate),
        recentTracking: submission.clips?.view_tracking.map(t => ({
          views: Number(t.views),
          scrapedAt: t.scrapedAt?.toISOString()
        })) || []
      } : null,

      // What Apify just returned
      apify: {
        error: apifyError,
        rawData: apifyRawData ? {
          // All potentially relevant view fields
          videoViewCount: apifyRawData.videoViewCount,
          videoPlayCount: apifyRawData.videoPlayCount,
          viewCount: apifyRawData.viewCount,
          playCount: apifyRawData.playCount,
          
          // The value we would use
          viewsWeRead: apifyRawData.videoViewCount || apifyRawData.videoPlayCount || 0,
          
          // Other metadata
          likesCount: apifyRawData.likesCount,
          commentsCount: apifyRawData.commentsCount,
          ownerUsername: apifyRawData.ownerUsername,
          timestamp: apifyRawData.timestamp,
          type: apifyRawData.type,
          productType: apifyRawData.productType,
          
          // Full raw data for inspection
          _fullResponse: apifyRawData
        } : null
      },

      // Discrepancy analysis
      analysis: {
        databaseViews: submission?.clips ? Number(submission.clips.views || 0) : 0,
        apifyViews: apifyRawData?.videoViewCount || apifyRawData?.videoPlayCount || 0,
        difference: (apifyRawData?.videoViewCount || apifyRawData?.videoPlayCount || 0) - 
                   (submission?.clips ? Number(submission.clips.views || 0) : 0),
        issue: null as string | null
      }
    }

    // Add issue diagnosis
    if (response.analysis.databaseViews === response.analysis.apifyViews) {
      response.analysis.issue = "Database matches Apify - issue is Apify returning stale data"
    } else if (response.analysis.apifyViews > response.analysis.databaseViews) {
      response.analysis.issue = "Apify has higher views - database not updating properly"
    } else {
      response.analysis.issue = "Database has higher views than Apify - unusual"
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error("Debug scrape error:", error)
    return NextResponse.json({ 
      error: "Debug scrape failed",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

