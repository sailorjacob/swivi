// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * PLATFORM HEALTH CHECK
 * 
 * Comprehensive check of all critical systems
 * Access: /api/debug/platform-health
 * 
 * Tests:
 * 1. Database connectivity
 * 2. Campaign spend consistency
 * 3. User earnings consistency  
 * 4. Cron job status
 * 5. Pending payouts
 * 6. Active campaigns ready for submissions
 */

interface HealthCheckResult {
  status: 'pass' | 'warn' | 'fail'
  message: string
  details?: any
}

interface HealthReport {
  timestamp: string
  overall: 'healthy' | 'degraded' | 'critical'
  checks: {
    database: HealthCheckResult
    campaignSpend: HealthCheckResult
    userEarnings: HealthCheckResult
    cronJobs: HealthCheckResult
    pendingPayouts: HealthCheckResult
    activeCampaigns: HealthCheckResult
    payoutSystem: HealthCheckResult
  }
  summary: {
    passed: number
    warnings: number
    failed: number
  }
}

export async function GET(request: NextRequest) {
  const report: HealthReport = {
    timestamp: new Date().toISOString(),
    overall: 'healthy',
    checks: {} as any,
    summary: { passed: 0, warnings: 0, failed: 0 }
  }

  // 1. Database Connectivity
  try {
    await prisma.$queryRaw`SELECT 1`
    report.checks.database = {
      status: 'pass',
      message: 'Database connection successful'
    }
  } catch (error) {
    report.checks.database = {
      status: 'fail',
      message: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // 2. Campaign Spend Consistency
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { status: { in: ['ACTIVE', 'SCHEDULED'] } },
      select: {
        id: true,
        title: true,
        budget: true,
        spent: true,
        status: true,
        clipSubmissions: {
          where: {
            status: 'APPROVED',
            clipId: { not: null }
          },
          include: {
            clips: { select: { earnings: true } }
          }
        }
      }
    })

    const mismatches: any[] = []
    for (const campaign of campaigns) {
      const actualSpent = campaign.clipSubmissions.reduce((sum, sub) => {
        return sum + Number(sub.clips?.earnings || 0)
      }, 0)
      const recordedSpent = Number(campaign.spent || 0)
      const diff = Math.abs(actualSpent - recordedSpent)

      if (diff > 0.01) {
        mismatches.push({
          title: campaign.title,
          recorded: recordedSpent,
          actual: actualSpent,
          difference: diff
        })
      }
    }

    if (mismatches.length > 0) {
      report.checks.campaignSpend = {
        status: 'warn',
        message: `${mismatches.length} campaign(s) have spend mismatch`,
        details: mismatches
      }
    } else {
      report.checks.campaignSpend = {
        status: 'pass',
        message: `${campaigns.length} campaign(s) have consistent spend tracking`
      }
    }
  } catch (error) {
    report.checks.campaignSpend = {
      status: 'fail',
      message: 'Failed to check campaign spend',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // 3. User Earnings Consistency
  try {
    const usersWithActiveEarnings = await prisma.user.findMany({
      where: {
        clipSubmissions: {
          some: {
            status: 'APPROVED',
            campaigns: { status: 'ACTIVE' }
          }
        }
      },
      select: {
        id: true,
        email: true,
        totalEarnings: true,
        clipSubmissions: {
          where: { status: 'APPROVED' },
          include: {
            clips: { select: { earnings: true } },
            campaigns: { select: { status: true } }
          }
        }
      },
      take: 100
    })

    const issues: any[] = []
    for (const user of usersWithActiveEarnings) {
      const activeClipEarnings = user.clipSubmissions
        .filter(s => s.campaigns.status === 'ACTIVE')
        .reduce((sum, s) => sum + Number(s.clips?.earnings || 0), 0)

      // User's totalEarnings should be >= active clip earnings
      if (Number(user.totalEarnings) < activeClipEarnings - 0.01) {
        issues.push({
          email: user.email,
          totalEarnings: Number(user.totalEarnings),
          activeClipEarnings
        })
      }
    }

    if (issues.length > 0) {
      report.checks.userEarnings = {
        status: 'warn',
        message: `${issues.length} user(s) have earnings mismatch`,
        details: issues
      }
    } else {
      report.checks.userEarnings = {
        status: 'pass',
        message: `${usersWithActiveEarnings.length} user(s) checked - all consistent`
      }
    }
  } catch (error) {
    report.checks.userEarnings = {
      status: 'fail',
      message: 'Failed to check user earnings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // 4. Cron Job Status
  try {
    const recentLogs = await prisma.cronJobLog.findMany({
      where: { jobName: 'view-tracking' },
      orderBy: { startedAt: 'desc' },
      take: 10
    })

    if (recentLogs.length === 0) {
      report.checks.cronJobs = {
        status: 'warn',
        message: 'No cron job logs found - view tracking may not be running'
      }
    } else {
      const lastRun = recentLogs[0]
      const hoursSinceLastRun = (Date.now() - lastRun.startedAt.getTime()) / (1000 * 60 * 60)
      const recentFailures = recentLogs.filter(l => l.status === 'FAILED').length

      if (hoursSinceLastRun > 2) {
        report.checks.cronJobs = {
          status: 'warn',
          message: `Last cron run was ${hoursSinceLastRun.toFixed(1)} hours ago`,
          details: {
            lastRun: lastRun.startedAt,
            status: lastRun.status,
            clipsProcessed: lastRun.clipsProcessed
          }
        }
      } else if (recentFailures > 3) {
        report.checks.cronJobs = {
          status: 'warn',
          message: `${recentFailures} failed runs in last 10`,
          details: recentLogs.map(l => ({ 
            time: l.startedAt, 
            status: l.status,
            error: l.errorMessage 
          }))
        }
      } else {
        report.checks.cronJobs = {
          status: 'pass',
          message: `Cron running normally - last run ${hoursSinceLastRun.toFixed(1)} hours ago`,
          details: {
            lastRun: lastRun.startedAt,
            status: lastRun.status,
            clipsProcessed: lastRun.clipsProcessed,
            earningsCalculated: lastRun.earningsCalculated
          }
        }
      }
    }
  } catch (error) {
    report.checks.cronJobs = {
      status: 'fail',
      message: 'Failed to check cron job status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // 5. Pending Payouts
  try {
    const pendingPayouts = await prisma.payoutRequest.findMany({
      where: { status: { in: ['PENDING', 'APPROVED', 'PROCESSING'] } },
      include: {
        users: { select: { email: true } }
      }
    })

    const totalPending = pendingPayouts.reduce((sum, p) => sum + Number(p.amount), 0)

    if (pendingPayouts.length > 10) {
      report.checks.pendingPayouts = {
        status: 'warn',
        message: `${pendingPayouts.length} pending payout requests ($${totalPending.toFixed(2)})`,
        details: pendingPayouts.map(p => ({
          email: p.users.email,
          amount: Number(p.amount),
          status: p.status,
          requestedAt: p.requestedAt
        }))
      }
    } else {
      report.checks.pendingPayouts = {
        status: 'pass',
        message: `${pendingPayouts.length} pending payout(s) ($${totalPending.toFixed(2)} total)`
      }
    }
  } catch (error) {
    report.checks.pendingPayouts = {
      status: 'fail',
      message: 'Failed to check pending payouts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // 6. Active Campaigns
  try {
    const activeCampaigns = await prisma.campaign.findMany({
      where: { status: 'ACTIVE', hidden: { not: true } },
      select: {
        id: true,
        title: true,
        budget: true,
        spent: true,
        _count: { select: { clipSubmissions: true } }
      }
    })

    const campaignsReady = activeCampaigns.filter(c => {
      const remaining = Number(c.budget) - Number(c.spent || 0)
      return remaining > 0
    })

    const nearBudget = activeCampaigns.filter(c => {
      const remaining = Number(c.budget) - Number(c.spent || 0)
      const percentUsed = (Number(c.spent || 0) / Number(c.budget)) * 100
      return percentUsed >= 90
    })

    if (campaignsReady.length === 0) {
      report.checks.activeCampaigns = {
        status: 'warn',
        message: 'No active campaigns with remaining budget',
        details: activeCampaigns.map(c => ({
          title: c.title,
          budget: Number(c.budget),
          spent: Number(c.spent || 0),
          submissions: c._count.clipSubmissions
        }))
      }
    } else {
      report.checks.activeCampaigns = {
        status: 'pass',
        message: `${campaignsReady.length} active campaign(s) accepting submissions`,
        details: {
          ready: campaignsReady.map(c => ({
            title: c.title,
            remaining: Number(c.budget) - Number(c.spent || 0)
          })),
          nearBudget: nearBudget.length > 0 ? nearBudget.map(c => c.title) : undefined
        }
      }
    }
  } catch (error) {
    report.checks.activeCampaigns = {
      status: 'fail',
      message: 'Failed to check active campaigns',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // 7. Payout System Integrity
  try {
    // Check that the proper payout flow is in place
    // Verify no users have negative balances
    const negativeBalances = await prisma.user.findMany({
      where: { totalEarnings: { lt: 0 } },
      select: { email: true, totalEarnings: true }
    })

    if (negativeBalances.length > 0) {
      report.checks.payoutSystem = {
        status: 'fail',
        message: `${negativeBalances.length} user(s) have negative balance!`,
        details: negativeBalances.map(u => ({
          email: u.email,
          balance: Number(u.totalEarnings)
        }))
      }
    } else {
      // Check recent payouts completed successfully
      const recentPayouts = await prisma.payout.findMany({
        where: { status: 'COMPLETED' },
        orderBy: { processedAt: 'desc' },
        take: 5,
        select: {
          amount: true,
          processedAt: true,
          transactionId: true
        }
      })

      report.checks.payoutSystem = {
        status: 'pass',
        message: 'Payout system healthy - no negative balances',
        details: {
          recentPayouts: recentPayouts.length,
          lastPayout: recentPayouts[0]?.processedAt || 'None'
        }
      }
    }
  } catch (error) {
    report.checks.payoutSystem = {
      status: 'fail',
      message: 'Failed to check payout system',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // Calculate summary
  for (const check of Object.values(report.checks)) {
    if (check.status === 'pass') report.summary.passed++
    else if (check.status === 'warn') report.summary.warnings++
    else if (check.status === 'fail') report.summary.failed++
  }

  // Determine overall status
  if (report.summary.failed > 0) {
    report.overall = 'critical'
  } else if (report.summary.warnings > 0) {
    report.overall = 'degraded'
  } else {
    report.overall = 'healthy'
  }

  return NextResponse.json(report, {
    status: report.overall === 'critical' ? 500 : 200
  })
}

