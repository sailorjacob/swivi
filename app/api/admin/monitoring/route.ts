// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { RateLimitingService } from "@/lib/rate-limiting-service"

/**
 * Admin monitoring endpoint for platform health
 * GET /api/admin/monitoring
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { role: true }
    })

    if (dbUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Gather all monitoring data in parallel
    const [
      // Cron job health
      recentCronJobs,
      failedCronJobs,
      
      // User activity
      newUsersToday,
      newUsersThisWeek,
      totalUsers,
      
      // Submission activity
      submissionsToday,
      submissionsThisWeek,
      pendingSubmissions,
      
      // Campaign health
      activeCampaigns,
      campaignsNearBudget,
      
      // System health
      rateLimitStats,
      
      // Clip tracking
      clipsNeedingTracking,
      recentViewTrackingErrors
    ] = await Promise.all([
      // Recent cron jobs (last 24h)
      prisma.cronJobLog.findMany({
        where: {
          jobName: 'view-tracking',
          startedAt: { gte: oneDayAgo }
        },
        orderBy: { startedAt: 'desc' },
        take: 10
      }),
      
      // Failed cron jobs (last 24h)
      prisma.cronJobLog.count({
        where: {
          jobName: 'view-tracking',
          status: 'FAILED',
          startedAt: { gte: oneDayAgo }
        }
      }),
      
      // New users today
      prisma.user.count({
        where: { createdAt: { gte: oneDayAgo } }
      }),
      
      // New users this week
      prisma.user.count({
        where: { createdAt: { gte: oneWeekAgo } }
      }),
      
      // Total users
      prisma.user.count(),
      
      // Submissions today
      prisma.clipSubmission.count({
        where: { createdAt: { gte: oneDayAgo } }
      }),
      
      // Submissions this week
      prisma.clipSubmission.count({
        where: { createdAt: { gte: oneWeekAgo } }
      }),
      
      // Pending submissions
      prisma.clipSubmission.count({
        where: { status: 'PENDING' }
      }),
      
      // Active campaigns
      prisma.campaign.count({
        where: { status: 'ACTIVE' }
      }),
      
      // Campaigns near budget (>80% spent)
      prisma.campaign.findMany({
        where: {
          status: 'ACTIVE'
        },
        select: {
          id: true,
          title: true,
          budget: true,
          spent: true
        }
      }).then(campaigns => 
        campaigns.filter(c => 
          Number(c.spent || 0) / Number(c.budget) > 0.8
        )
      ),
      
      // Rate limit stats
      RateLimitingService.getInstance().getRateLimitStats(),
      
      // Clips needing tracking (no tracking in last 8 hours)
      prisma.clip.count({
        where: {
          status: 'ACTIVE',
          clipSubmissions: {
            some: {
              status: 'APPROVED',
              campaigns: {
                status: 'ACTIVE'
              }
            }
          },
          view_tracking: {
            none: {
              date: { gte: new Date(now.getTime() - 8 * 60 * 60 * 1000) }
            }
          }
        }
      }),
      
      // Recent view tracking errors
      prisma.cronJobLog.findMany({
        where: {
          jobName: 'view-tracking',
          status: 'SUCCESS',
          clipsFailed: { gt: 0 },
          startedAt: { gte: oneDayAgo }
        },
        select: {
          startedAt: true,
          clipsFailed: true,
          details: true
        },
        orderBy: { startedAt: 'desc' },
        take: 5
      })
    ])

    // Calculate cron job success rate
    const totalCronJobs = recentCronJobs.length
    const successfulCronJobs = recentCronJobs.filter(j => j.status === 'SUCCESS').length
    const cronSuccessRate = totalCronJobs > 0 
      ? ((successfulCronJobs / totalCronJobs) * 100).toFixed(1) 
      : 'N/A'

    // Calculate average earnings per cron run
    const totalEarningsFromCron = recentCronJobs.reduce(
      (sum, job) => sum + Number(job.earningsCalculated || 0), 
      0
    )
    const avgEarningsPerRun = totalCronJobs > 0 
      ? (totalEarningsFromCron / totalCronJobs).toFixed(2) 
      : '0'

    // Determine overall health status
    let healthStatus: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' = 'HEALTHY'
    const issues: string[] = []

    if (failedCronJobs > 2) {
      healthStatus = 'DEGRADED'
      issues.push(`${failedCronJobs} failed cron jobs in last 24h`)
    }

    if (pendingSubmissions > 50) {
      healthStatus = 'DEGRADED'
      issues.push(`${pendingSubmissions} submissions awaiting review`)
    }

    if (clipsNeedingTracking > 100) {
      healthStatus = 'DEGRADED'
      issues.push(`${clipsNeedingTracking} clips haven't been tracked in 8+ hours`)
    }

    if (campaignsNearBudget.length > 0) {
      issues.push(`${campaignsNearBudget.length} campaigns are >80% spent`)
    }

    if (parseFloat(cronSuccessRate) < 80 && cronSuccessRate !== 'N/A') {
      healthStatus = 'UNHEALTHY'
      issues.push(`Cron success rate is only ${cronSuccessRate}%`)
    }

    return NextResponse.json({
      timestamp: now.toISOString(),
      status: healthStatus,
      issues: issues.length > 0 ? issues : ['No issues detected'],
      
      cronHealth: {
        recentRuns: totalCronJobs,
        successRate: `${cronSuccessRate}%`,
        failedJobs: failedCronJobs,
        avgEarningsPerRun: `$${avgEarningsPerRun}`,
        lastRun: recentCronJobs[0]?.startedAt || 'Never',
        recentErrors: recentViewTrackingErrors.map(e => ({
          time: e.startedAt,
          failedClips: e.clipsFailed
        }))
      },
      
      userActivity: {
        totalUsers,
        newToday: newUsersToday,
        newThisWeek: newUsersThisWeek,
        growthRate: totalUsers > 0 
          ? `${((newUsersThisWeek / totalUsers) * 100).toFixed(1)}%/week` 
          : 'N/A'
      },
      
      submissions: {
        today: submissionsToday,
        thisWeek: submissionsThisWeek,
        pendingReview: pendingSubmissions,
        avgPerDay: (submissionsThisWeek / 7).toFixed(1)
      },
      
      campaigns: {
        active: activeCampaigns,
        nearBudget: campaignsNearBudget.map(c => ({
          id: c.id,
          title: c.title,
          percentSpent: ((Number(c.spent || 0) / Number(c.budget)) * 100).toFixed(1)
        }))
      },
      
      viewTracking: {
        clipsNeedingUpdate: clipsNeedingTracking,
        staleThresholdHours: 8
      },
      
      rateLimiting: rateLimitStats
    })

  } catch (error) {
    console.error("Error in monitoring endpoint:", error)
    return NextResponse.json(
      { 
        status: 'ERROR',
        error: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    )
  }
}






















