// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"

/**
 * Diagnostic endpoint to check view tracking status
 * Admin only - helps identify why tracking isn't working
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const { user, error: authError } = await getServerUserWithRole(request)
    
    if (!user?.id || authError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { role: true }
    })
    
    if (!dbUser || dbUser.role !== 'ADMIN') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Diagnostic data collection
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      issues: [],
      recommendations: []
    }

    // 1. Check for stuck RUNNING cron jobs
    const runningJobs = await prisma.cronJobLog.findMany({
      where: {
        jobName: 'view-tracking',
        status: 'RUNNING'
      },
      orderBy: { startedAt: 'desc' },
      take: 5
    })

    diagnostics.stuckJobs = runningJobs.map(job => ({
      id: job.id,
      startedAt: job.startedAt.toISOString(),
      minutesRunning: Math.round((Date.now() - job.startedAt.getTime()) / 60000)
    }))

    if (runningJobs.length > 0) {
      diagnostics.issues.push(`⚠️ Found ${runningJobs.length} RUNNING cron jobs - these block new runs!`)
      diagnostics.recommendations.push("Run the FIX query in diagnose-view-tracking.sql to clear stuck jobs")
    }

    // 2. Check recent cron logs
    const recentLogs = await prisma.cronJobLog.findMany({
      where: { jobName: 'view-tracking' },
      orderBy: { startedAt: 'desc' },
      take: 10
    })

    diagnostics.recentCronRuns = recentLogs.map(log => ({
      id: log.id,
      status: log.status,
      startedAt: log.startedAt.toISOString(),
      duration: log.duration,
      clipsProcessed: log.clipsProcessed,
      clipsSuccessful: log.clipsSuccessful,
      clipsFailed: log.clipsFailed,
      errorMessage: log.errorMessage
    }))

    // Check if any cron ran in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentRuns = recentLogs.filter(log => log.startedAt > oneHourAgo)
    if (recentRuns.length === 0) {
      diagnostics.issues.push("⚠️ No cron jobs ran in the last hour!")
      diagnostics.recommendations.push("Check Vercel Dashboard → Crons tab to see if crons are enabled")
      diagnostics.recommendations.push("Vercel Crons require Pro plan for 5-minute timeouts")
    }

    // 3. Check active campaigns with approved clips
    const activeCampaigns = await prisma.campaign.findMany({
      where: {
        status: 'ACTIVE',
        isTest: false,
        deletedAt: null
      },
      select: {
        id: true,
        title: true,
        budget: true,
        spent: true,
        _count: {
          select: {
            clipSubmissions: {
              where: { status: 'APPROVED' }
            }
          }
        }
      }
    })

    diagnostics.activeCampaigns = activeCampaigns.map(c => ({
      id: c.id,
      title: c.title,
      budget: Number(c.budget),
      spent: Number(c.spent || 0),
      approvedSubmissions: c._count.clipSubmissions
    }))

    if (activeCampaigns.length === 0) {
      diagnostics.issues.push("⚠️ No active campaigns found!")
    }

    const totalApproved = activeCampaigns.reduce((sum, c) => sum + c._count.clipSubmissions, 0)
    if (totalApproved === 0) {
      diagnostics.issues.push("⚠️ No approved submissions in active campaigns!")
    }

    // 4. Check clips that should be tracked
    const clipsToTrack = await prisma.clip.findMany({
      where: {
        status: 'ACTIVE',
        clipSubmissions: {
          some: {
            status: 'APPROVED',
            campaigns: {
              status: 'ACTIVE',
              isTest: false,
              deletedAt: null
            }
          }
        }
      },
      select: {
        id: true,
        url: true,
        platform: true,
        views: true,
        earnings: true,
        view_tracking: {
          orderBy: { scrapedAt: 'desc' },
          take: 1,
          select: { date: true, scrapedAt: true, views: true }
        },
        clipSubmissions: {
          where: { status: 'APPROVED' },
          select: {
            campaigns: {
              select: { title: true }
            }
          }
        }
      },
      take: 20
    })

    diagnostics.clipsNeedingTracking = clipsToTrack.map(clip => {
      const lastScrapedAt = clip.view_tracking[0]?.scrapedAt || clip.view_tracking[0]?.date
      return {
        id: clip.id,
        url: clip.url.substring(0, 60) + '...',
        platform: clip.platform,
        views: Number(clip.views || 0),
        earnings: Number(clip.earnings || 0),
        lastTracked: lastScrapedAt?.toISOString() || 'NEVER',
        hoursSinceTracked: lastScrapedAt 
          ? Math.round((Date.now() - lastScrapedAt.getTime()) / (1000 * 60 * 60))
          : null,
        campaign: clip.clipSubmissions[0]?.campaigns?.title || 'Unknown'
      }
    })

    if (clipsToTrack.length === 0) {
      diagnostics.issues.push("⚠️ No clips eligible for tracking!")
      diagnostics.recommendations.push("Make sure clips have status 'ACTIVE' (not INACTIVE or REMOVED)")
    } else {
      // Check if clips are stale (not tracked recently)
      const staleClips = clipsToTrack.filter(clip => {
        if (!clip.view_tracking[0]?.date) return true
        const hours = (Date.now() - clip.view_tracking[0].date.getTime()) / (1000 * 60 * 60)
        return hours > 1 // More than 1 hour old
      })
      
      if (staleClips.length > 0) {
        diagnostics.issues.push(`⚠️ ${staleClips.length} clips haven't been tracked in over 1 hour`)
      }
    }

    // 5. Summary
    diagnostics.summary = {
      stuckJobs: runningJobs.length,
      cronRunsLastHour: recentRuns.length,
      activeCampaigns: activeCampaigns.length,
      totalApprovedSubmissions: totalApproved,
      clipsEligibleForTracking: clipsToTrack.length,
      issueCount: diagnostics.issues.length
    }

    // Overall status
    if (diagnostics.issues.length === 0) {
      diagnostics.status = "✅ HEALTHY"
      diagnostics.message = "View tracking appears to be working correctly"
    } else {
      diagnostics.status = "⚠️ ISSUES DETECTED"
      diagnostics.message = `Found ${diagnostics.issues.length} potential issues`
    }

    return NextResponse.json(diagnostics)

  } catch (error) {
    console.error("Error in diagnostic endpoint:", error)
    return NextResponse.json({ 
      error: "Diagnostic failed",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * POST endpoint to fix stuck jobs
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const { user, error: authError } = await getServerUserWithRole(request)
    
    if (!user?.id || authError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { role: true }
    })
    
    if (!dbUser || dbUser.role !== 'ADMIN') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { action } = await request.json()

    if (action === 'fix-stuck-jobs') {
      // Mark all RUNNING jobs older than 10 minutes as FAILED
      const cutoff = new Date(Date.now() - 10 * 60 * 1000)
      
      const result = await prisma.cronJobLog.updateMany({
        where: {
          jobName: 'view-tracking',
          status: 'RUNNING',
          startedAt: { lt: cutoff }
        },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: 'Manually cleared - was stuck in RUNNING state'
        }
      })

      return NextResponse.json({
        success: true,
        message: `Cleared ${result.count} stuck jobs`,
        clearedCount: result.count
      })
    }

    if (action === 'trigger-tracking') {
      // Import and run view tracking manually
      const { ViewTrackingService } = await import("@/lib/view-tracking-service")
      const service = new ViewTrackingService()
      
      // Process a small batch
      const result = await service.processViewTracking(20, 5)
      
      return NextResponse.json({
        success: true,
        message: "Manually triggered view tracking",
        result: {
          processed: result.processed,
          successful: result.successful,
          failed: result.failed,
          earningsAdded: result.totalEarningsAdded
        }
      })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })

  } catch (error) {
    console.error("Error in diagnostic action:", error)
    return NextResponse.json({ 
      error: "Action failed",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

