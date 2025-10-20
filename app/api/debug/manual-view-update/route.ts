// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { XViewTrackingService } from "@/lib/x-view-tracking"

export async function POST(request: NextRequest) {
  try {
    const { campaignId } = await request.json()
    
    if (!campaignId) {
      return NextResponse.json({
        error: "Campaign ID is required"
      }, { status: 400 })
    }

    console.log(`🔄 Manually updating views for campaign: ${campaignId}`)
    
    const viewTrackingService = new XViewTrackingService()
    
    // Get active campaigns (or just the specified one)
    const activeCampaignIds = [campaignId]
    
    // Update views for all platforms in this campaign
    await viewTrackingService.updateAllPlatformViews()
    
    // Get updated stats
    const updatedStats = await viewTrackingService.getCampaignViewStats(campaignId)
    
    return NextResponse.json({
      success: true,
      message: `Successfully updated views for campaign ${campaignId}`,
      stats: updatedStats
    })

  } catch (error) {
    console.error("Error in manual view update:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to update views",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Manually triggering view update for all active campaigns...')
    
    const viewTrackingService = new XViewTrackingService()
    
    // Update all platform views for active campaigns
    await viewTrackingService.updateAllPlatformViews()
    
    return NextResponse.json({
      success: true,
      message: "Successfully updated views for all active campaigns"
    })

  } catch (error) {
    console.error("Error in manual view update:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to update views",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
