// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { SimpleViewTracker } from "@/lib/simple-view-tracker"
import { prisma } from "@/lib/prisma"

// This endpoint is called by Vercel Cron Jobs every 15 minutes
// It processes clips ONE BY ONE - simple, reliable, consistent

// Lock timeout in minutes - if a job is older than this, consider it stale
const LOCK_TIMEOUT_MINUTES = 20

export async function GET(request: NextRequest) {
  try {
    // Security check for Vercel cron jobs
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

    // ============================================
    // LOCK CHECK: Prevent overlapping runs
    // ============================================
    const lockCutoff = new Date(Date.now() - LOCK_TIMEOUT_MINUTES * 60 * 1000)
    
    // Check if there's a recent job still running
    const runningJob = await prisma.cronJobLog.findFirst({
      where: {
        jobName: 'view-tracking',
        status: 'RUNNING',
        startedAt: { gte: lockCutoff } // Only consider jobs started within timeout window
      },
      orderBy: { startedAt: 'desc' }
    })

    if (runningJob) {
      console.log(`⏳ View tracking job already running (started ${runningJob.startedAt.toISOString()}). Skipping this run.`)
      return NextResponse.json({
        success: false,
        message: "Another view tracking job is already running",
        runningJobId: runningJob.id,
        startedAt: runningJob.startedAt.toISOString()
      }, { status: 200 }) // Return 200 so Vercel doesn't retry
    }

    // Create a "RUNNING" lock record
    const lockRecord = await prisma.cronJobLog.create({
      data: {
        jobName: 'view-tracking',
        status: 'RUNNING',
        startedAt: new Date()
      }
    })
    console.log(`🔒 Acquired lock for view tracking job: ${lockRecord.id}`)

    console.log('🚀 Starting simple one-by-one view tracking...')
    const startTime = Date.now()

    // Initialize the simple view tracker
    const tracker = new SimpleViewTracker()

    // Run the tracking loop - processes clips one by one
    // - maxDurationMs: Stop 30s before Vercel's 300s timeout
    // - maxClips: Process up to 150 clips per run
    // - delayBetweenMs: 500ms between clips (be nice to Apify)
    const result = await tracker.runTrackingLoop({
      maxDurationMs: 270000,  // 270 seconds (leave 30s buffer)
      maxClips: 150,          // Up to 150 clips per run
      delayBetweenMs: 500     // 500ms between clips
    })

    const duration = Date.now() - startTime

    console.log(`✅ View tracking completed in ${(duration / 1000).toFixed(1)}s`)
    console.log(`   Processed: ${result.processed} clips`)
    console.log(`   Successful: ${result.successful}`)
    console.log(`   Failed: ${result.failed}`)
    console.log(`   Views gained: ${result.totalViewsGained.toLocaleString()}`)
    console.log(`   Earnings added: $${result.totalEarningsAdded.toFixed(2)}`)
    console.log(`   Stopped because: ${result.stoppedReason}`)

    // Update lock record with success
    try {
      await prisma.cronJobLog.update({
        where: { id: lockRecord.id },
        data: {
          status: result.failed > 0 ? 'PARTIAL_SUCCESS' : 'SUCCESS',
          completedAt: new Date(),
          duration: Math.round(duration / 1000),
          clipsProcessed: result.processed,
          clipsSuccessful: result.successful,
          clipsFailed: result.failed,
          earningsCalculated: result.totalEarningsAdded,
          details: {
            viewsGained: result.totalViewsGained,
            stoppedReason: result.stoppedReason
          }
        }
      })
      console.log(`🔓 Released lock for view tracking job: ${lockRecord.id}`)
    } catch (logError) {
      console.error('Failed to update cron job log:', logError)
    }

    return NextResponse.json({
      success: true,
      message: "View tracking completed",
      duration: `${(duration / 1000).toFixed(1)}s`,
      stats: {
        processed: result.processed,
        successful: result.successful,
        failed: result.failed,
        viewsGained: result.totalViewsGained,
        earningsAdded: `$${result.totalEarningsAdded.toFixed(2)}`,
        stoppedReason: result.stoppedReason
      }
    })

  } catch (error) {
    console.error("❌ Error in view tracking cron job:", error)

    // Try to update/create failure log
    try {
      // Check if we have a lock record to update
      const recentLock = await prisma.cronJobLog.findFirst({
        where: {
          jobName: 'view-tracking',
          status: 'RUNNING',
          startedAt: { gte: new Date(Date.now() - 10 * 60 * 1000) }
        },
        orderBy: { startedAt: 'desc' }
      })

      if (recentLock) {
        await prisma.cronJobLog.update({
          where: { id: recentLock.id },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          }
        })
      } else {
        await prisma.cronJobLog.create({
          data: {
            jobName: 'view-tracking',
            status: 'FAILED',
            startedAt: new Date(),
            completedAt: new Date(),
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          }
        })
      }
    } catch (logError) {
      console.error('Failed to log cron job failure:', logError)
    }

    return NextResponse.json(
      { 
        error: "Failed to update view tracking",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Health check endpoint for cron monitoring
export async function HEAD() {
  return new Response(null, { status: 200 })
}
