// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// This endpoint is called by Vercel Cron Jobs every 5 minutes
// It activates SCHEDULED campaigns whose startDate has passed

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

    console.log('🚀 Checking for scheduled campaigns to activate...')
    const startTime = Date.now()
    const now = new Date()

    // Find all SCHEDULED campaigns whose startDate has passed
    const scheduledCampaigns = await prisma.campaign.findMany({
      where: {
        status: 'SCHEDULED',
        startDate: {
          lte: now
        }
      },
      select: {
        id: true,
        title: true,
        startDate: true
      }
    })

    if (scheduledCampaigns.length === 0) {
      console.log('✅ No scheduled campaigns ready to activate')
      return NextResponse.json({
        success: true,
        message: 'No scheduled campaigns to activate',
        activated: 0
      })
    }

    console.log(`📋 Found ${scheduledCampaigns.length} campaign(s) to activate`)

    // Activate each campaign
    const activatedCampaigns: string[] = []
    const errors: string[] = []

    for (const campaign of scheduledCampaigns) {
      try {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { 
            status: 'ACTIVE',
            updatedAt: now
          }
        })
        activatedCampaigns.push(campaign.title)
        console.log(`✅ Activated campaign: ${campaign.title} (was scheduled for ${campaign.startDate})`)
      } catch (error) {
        const errorMsg = `Failed to activate campaign ${campaign.id}: ${error}`
        console.error(`❌ ${errorMsg}`)
        errors.push(errorMsg)
      }
    }

    const duration = Date.now() - startTime

    console.log(`✅ Campaign activation completed in ${duration}ms`)
    console.log(`   Activated: ${activatedCampaigns.length}`)
    console.log(`   Errors: ${errors.length}`)

    return NextResponse.json({
      success: true,
      activated: activatedCampaigns.length,
      campaigns: activatedCampaigns,
      errors: errors.length > 0 ? errors : undefined,
      duration: `${duration}ms`
    })

  } catch (error) {
    console.error('❌ Campaign activation cron error:', error)
    return NextResponse.json(
      { 
        error: "Campaign activation failed", 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

