// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { XViewTrackingService } from "@/lib/x-view-tracking"
import { PayoutCalculationService } from "@/lib/payout-calculation"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    
    if (campaignId) {
      // Get stats for a specific campaign
      return await getCampaignStats(campaignId)
    } else {
      // Get stats for all active campaigns
      return await getAllCampaignStats()
    }
    
  } catch (error) {
    console.error("Error fetching campaign stats:", error)
    return NextResponse.json({
      error: "Failed to fetch campaign stats",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

async function getCampaignStats(campaignId: string) {
  try {
    const viewTrackingService = new XViewTrackingService()
    const payoutService = new PayoutCalculationService()
    
    // Get campaign details
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        clipSubmissions: {
          where: {
            status: {
              in: ['PENDING', 'APPROVED', 'PAID']
            }
          },
          include: {
            clip: {
              include: {
                viewTracking: true
              }
            }
          }
        }
      }
    })
    
    if (!campaign) {
      return NextResponse.json({
        error: "Campaign not found"
      }, { status: 404 })
    }
    
    // Get view stats
    const viewStats = await viewTrackingService.getCampaignViewStats(campaignId)
    
    // Get payout stats
    const payoutStats = await payoutService.getCampaignStats(campaignId)
    
    // Calculate progress percentages and budget remaining
    const budgetProgress = campaign.budget > 0 ? (payoutStats.totalSpent / Number(campaign.budget)) * 100 : 0
    const viewProgress = campaign.viewGoal ? (viewStats.totalViews / campaign.viewGoal) * 100 : 0
    const remainingBudget = Number(campaign.budget) - payoutStats.totalSpent
    
    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.id,
        title: campaign.title,
        status: campaign.status,
        budget: Number(campaign.budget),
        spent: payoutStats.totalSpent,
        budgetProgress: Math.min(budgetProgress, 100),
        remainingBudget: payoutStats.remainingBudget,
        totalViews: viewStats.totalViews,
        viewGoal: campaign.viewGoal || null,
        viewProgress: Math.min(viewProgress, 100),
        totalSubmissions: viewStats.totalSubmissions,
        approvedSubmissions: payoutStats.approvedSubmissions,
        daysRemaining,
        platformBreakdown: viewStats.platformBreakdown,
        topPerformingSubmission: viewStats.topPerformingSubmission,
        averageViewsPerSubmission: viewStats.averageViewsPerSubmission,
        projectedCompletionDate: payoutStats.projectedCompletionDate
      }
    })
    
  } catch (error) {
    console.error(`Error getting stats for campaign ${campaignId}:`, error)
    throw error
  }
}

async function getAllCampaignStats() {
  try {
    const viewTrackingService = new XViewTrackingService()
    
    // Get all active campaigns
    const campaigns = await prisma.campaign.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        clipSubmissions: {
          where: {
            status: {
              in: ['PENDING', 'APPROVED', 'PAID']
            }
          }
        },
        _count: {
          select: {
            clipSubmissions: true
          }
        }
      }
    })
    
    // Calculate aggregate stats
    let totalViews = 0
    let totalBudget = 0
    let totalSpent = 0
    let totalSubmissions = 0
    
    const campaignStats = []
    
    for (const campaign of campaigns) {
      try {
        const viewStats = await viewTrackingService.getCampaignViewStats(campaign.id)
        const payoutService = new PayoutCalculationService()
        const payoutStats = await payoutService.getCampaignStats(campaign.id)
        
        totalViews += viewStats.totalViews
        totalBudget += Number(campaign.budget)
        totalSpent += payoutStats.totalSpent
        totalSubmissions += viewStats.totalSubmissions
        
        const budgetProgress = campaign.budget > 0 ? (payoutStats.totalSpent / Number(campaign.budget)) * 100 : 0
        
        campaignStats.push({
          id: campaign.id,
          title: campaign.title,
          budget: Number(campaign.budget),
          spent: payoutStats.totalSpent,
          budgetProgress: Math.min(budgetProgress, 100),
          totalViews: viewStats.totalViews,
          totalSubmissions: viewStats.totalSubmissions,
          status: campaign.status
        })
        
      } catch (error) {
        console.error(`Error processing campaign ${campaign.id}:`, error)
        // Continue with other campaigns
      }
    }
    
    return NextResponse.json({
      success: true,
      summary: {
        totalActiveCampaigns: campaigns.length,
        totalViews: totalViews,
        totalBudget: totalBudget,
        totalSpent: totalSpent,
        totalSubmissions: totalSubmissions,
        averageViewsPerCampaign: campaigns.length > 0 ? Math.round(totalViews / campaigns.length) : 0,
        budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
      },
      campaigns: campaignStats
    })
    
  } catch (error) {
    console.error("Error getting all campaign stats:", error)
    throw error
  }
}
