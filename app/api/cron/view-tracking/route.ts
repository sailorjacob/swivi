// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { ViewTrackingService } from "@/lib/view-tracking-service"
import { prisma } from "@/lib/prisma"

// This endpoint is called by Vercel Cron Jobs every 5 minutes
// It handles: view tracking → earnings calculation → budget updates → campaign completion

// Lock timeout in minutes - if a job is older than this, consider it stale
const LOCK_TIMEOUT_MINUTES = 10

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

    console.log('🚀 Starting integrated view tracking and earnings calculation...')
    const startTime = Date.now()

    // Initialize the view tracking service
    const viewTrackingService = new ViewTrackingService()

    // Process view tracking with integrated earnings calculation
    // This will:
    // 1. Scrape views for active clips (in smaller batches for Apify)
    // 2. Calculate earnings from view growth
    // 3. Update clip, user, and campaign earnings
    // 4. Check budget limits and complete campaigns if needed
    // 5. Send notifications when campaigns complete
    // 6. Handle large campaigns (>100 clips) by processing them alone
    const result = await viewTrackingService.processViewTracking(100, 5)

    const duration = Date.now() - startTime

    console.log(`✅ View tracking completed in ${duration}ms`)
    console.log(`   Processed: ${result.processed}`)
    console.log(`   Successful: ${result.successful}`)
    console.log(`   Failed: ${result.failed}`)
    console.log(`   Earnings Added: $${result.totalEarningsAdded.toFixed(2)}`)
    
    if (result.campaignsCompleted.length > 0) {
      console.log(`   Campaigns Completed: ${result.campaignsCompleted.length}`)
    }

    if (result.errors.length > 0) {
      console.warn('⚠️ Errors during tracking:', result.errors)
    }

    // Update lock record with success
    try {
      await prisma.cronJobLog.update({
        where: { id: lockRecord.id },
        data: {
          status: result.failed > 0 ? 'PARTIAL_SUCCESS' : 'SUCCESS',
          completedAt: new Date(),
          duration: Math.round(duration / 1000), // Convert to seconds
          clipsProcessed: result.processed,
          clipsSuccessful: result.successful,
          clipsFailed: result.failed,
          earningsCalculated: result.totalEarningsAdded,
          campaignsCompleted: result.campaignsCompleted.length,
          errorMessage: result.errors.length > 0 ? result.errors.slice(0, 5).join('; ') : null,
          details: {
            campaignsCompleted: result.campaignsCompleted,
            errorCount: result.errors.length
          }
        }
      })
      console.log(`🔓 Released lock for view tracking job: ${lockRecord.id}`)
    } catch (logError) {
      console.error('Failed to update cron job log:', logError)
    }

    return NextResponse.json({
      success: true,
      message: "View tracking and earnings calculation completed successfully",
      duration: `${duration}ms`,
      stats: {
        processed: result.processed,
        successful: result.successful,
        failed: result.failed,
        earningsAdded: `$${result.totalEarningsAdded.toFixed(2)}`,
        campaignsCompleted: result.campaignsCompleted.length
      },
      errors: result.errors.length > 0 ? result.errors : undefined
    })

  } catch (error) {
    console.error("❌ Error in view tracking cron job:", error)

    // Update lock record with failure (if we have one)
    // @ts-ignore - lockRecord may not exist if error was early
    if (typeof lockRecord !== 'undefined' && lockRecord?.id) {
      try {
        await prisma.cronJobLog.update({
          // @ts-ignore
          where: { id: lockRecord.id },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
            duration: 0,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            details: {
              stack: error instanceof Error ? error.stack : undefined
            }
          }
        })
        // @ts-ignore
        console.log(`🔓 Released lock (with failure) for view tracking job: ${lockRecord.id}`)
      } catch (logError) {
        console.error('Failed to update cron job failure log:', logError)
      }
    } else {
      // No lock record yet, create a failure entry
      try {
        await prisma.cronJobLog.create({
          data: {
            jobName: 'view-tracking',
            status: 'FAILED',
            startedAt: new Date(),
            completedAt: new Date(),
            duration: 0,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            details: {
              stack: error instanceof Error ? error.stack : undefined
            }
          }
        })
      } catch (logError) {
        console.error('Failed to log cron job failure:', logError)
      }
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
