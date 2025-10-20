// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { PayoutCalculationService } from "@/lib/payout-calculation"

// This endpoint should only be called by authorized services (cron jobs, etc.)
// In production, add proper authentication/authorization

export async function GET(request: NextRequest) {
  try {
    // Security check for Vercel cron jobs
    // Vercel cron jobs come from specific IPs/user agents
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

    console.log('🚀 Starting automated payout calculation...')
    const startTime = Date.now()

    const payoutService = new PayoutCalculationService()

    // Calculate payouts for all campaigns
    const results = await payoutService.calculateAllCampaignPayouts()

    // Process any pending payouts
    await payoutService.processPendingPayouts()

    const duration = Date.now() - startTime

    // Log summary
    const completedCampaigns = results.filter(r => r.shouldComplete).length
    const totalPayouts = results.reduce((sum, r) => sum + r.payouts.length, 0)
    const totalSpent = results.reduce((sum, r) => sum + r.totalSpent, 0)

    console.log(`✅ Payout calculation completed in ${duration}ms`)
    console.log(`📊 Summary: ${completedCampaigns} campaigns completed, ${totalPayouts} payouts processed, $${totalSpent.toFixed(2)} total spent`)

    return NextResponse.json({
      success: true,
      message: "Payout calculation completed successfully",
      duration: `${duration}ms`,
      summary: {
        completedCampaigns,
        totalPayouts,
        totalSpent: `$${totalSpent.toFixed(2)}`
      },
      results
    })

  } catch (error) {
    console.error("Error in automated payout calculation:", error)

    return NextResponse.json(
      { error: "Failed to calculate payouts" },
      { status: 500 }
    )
  }
}

// Health check endpoint for cron monitoring
export async function HEAD() {
  return new Response(null, { status: 200 })
}
