// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { CampaignSpendSync } from "@/lib/campaign-spend-sync"

/**
 * GET - Preview sync status for all campaigns
 * Shows what would change without actually updating
 */
export async function GET(request: NextRequest) {
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

    // Get sync status for all campaigns
    const status = await CampaignSpendSync.getSyncStatus()

    // Calculate totals
    const needsSyncCount = status.filter(c => c.needsSync).length
    const totalDifference = status.reduce((sum, c) => sum + c.difference, 0)

    return NextResponse.json({
      success: true,
      campaigns: status,
      summary: {
        total: status.length,
        needsSync: needsSyncCount,
        inSync: status.length - needsSyncCount,
        totalDifference: totalDifference
      }
    })

  } catch (error) {
    console.error("Error getting sync status:", error)
    return NextResponse.json({ 
      error: "Failed to get sync status",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

/**
 * POST - Sync campaign.spent for all campaigns or a specific campaign
 */
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

    const body = await request.json().catch(() => ({}))
    const { campaignId } = body

    // Sync specific campaign or all campaigns
    if (campaignId) {
      const result = await CampaignSpendSync.syncCampaign(campaignId)
      return NextResponse.json({
        success: true,
        message: `Campaign "${result.campaignTitle}" synced successfully`,
        ...result
      })
    } else {
      const result = await CampaignSpendSync.syncAllCampaigns()
      return NextResponse.json({
        success: true,
        message: `Synced ${result.synced} campaigns`,
        ...result
      })
    }

  } catch (error) {
    console.error("Error syncing campaign spend:", error)
    return NextResponse.json({ 
      error: "Failed to sync campaign spend",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

