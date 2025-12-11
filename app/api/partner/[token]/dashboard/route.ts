export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token

    if (!token || token.length < 10) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 })
    }

    // Find the campaign with this token to get partner info
    const partnerCampaign = await prisma.campaign.findFirst({
      where: { clientAccessToken: token },
      select: { creator: true }
    })

    if (!partnerCampaign) {
      return NextResponse.json({ error: "Invalid access token" }, { status: 404 })
    }

    const partnerName = partnerCampaign.creator || "Partner"

    // Get all campaigns for this partner token
    // For now, we'll just get the single campaign associated with this token
    // In a full implementation, you'd want a proper partner entity
    const campaigns = await prisma.campaign.findMany({
      where: { clientAccessToken: token },
      select: {
        id: true,
        title: true,
        status: true,
        budget: true,
        spent: true,
        targetPlatforms: true,
        createdAt: true,
        _count: {
          select: {
            clipSubmissions: true
          }
        },
        clipSubmissions: {
          where: {
            status: { in: ['APPROVED', 'PAID'] }
          },
          select: {
            id: true,
            clipUrl: true,
            platform: true,
            users: {
              select: {
                name: true
              }
            },
            clips: {
              select: {
                views: true
              }
            }
          },
          orderBy: {
            clips: {
              views: 'desc'
            }
          },
          take: 10
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate summary stats
    let totalBudget = 0
    let totalSpent = 0
    let totalViews = 0
    let totalSubmissions = 0
    let approvedSubmissions = 0
    let activeCampaigns = 0
    let completedCampaigns = 0

    const recentCampaigns = campaigns.map(campaign => {
      const budget = Number(campaign.budget || 0)
      const spent = Number(campaign.spent || 0)
      
      totalBudget += budget
      totalSpent += spent
      totalSubmissions += campaign._count.clipSubmissions
      
      let campaignViews = 0
      campaign.clipSubmissions.forEach(sub => {
        const views = Number(sub.clips?.views || 0)
        campaignViews += views
        totalViews += views
      })
      
      approvedSubmissions += campaign.clipSubmissions.length
      
      if (campaign.status === 'ACTIVE') activeCampaigns++
      if (campaign.status === 'COMPLETED') completedCampaigns++

      return {
        id: campaign.id,
        title: campaign.title,
        status: campaign.status,
        budget,
        spent,
        views: campaignViews,
        submissions: campaign.clipSubmissions.length,
        platforms: campaign.targetPlatforms,
        createdAt: campaign.createdAt.toISOString()
      }
    })

    // Get top performers across all campaigns
    const topPerformers = campaigns
      .flatMap(campaign => 
        campaign.clipSubmissions.map(sub => ({
          id: sub.id,
          clipUrl: sub.clipUrl,
          platform: sub.platform,
          creatorName: sub.users.name || 'Creator',
          views: Number(sub.clips?.views || 0),
          campaignTitle: campaign.title
        }))
      )
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)

    return NextResponse.json({
      partnerName,
      summary: {
        totalCampaigns: campaigns.length,
        activeCampaigns,
        completedCampaigns,
        totalBudget,
        totalSpent,
        totalViews,
        totalSubmissions,
        approvedSubmissions
      },
      recentCampaigns,
      topPerformers
    })
  } catch (error) {
    console.error("Error fetching partner dashboard:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
