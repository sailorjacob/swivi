// Force this route to be dynamic (not statically generated)
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

    // Find campaign by client access token
    const campaign = await prisma.campaign.findUnique({
      where: { clientAccessToken: token },
      select: {
        id: true,
        title: true,
        description: true,
        creator: true,
        budget: true,
        spent: true,
        payoutRate: true,
        startDate: true,
        endDate: true,
        status: true,
        targetPlatforms: true,
        featuredImage: true,
        completedAt: true,
        budgetReachedAt: true,
        budgetReachedViews: true,
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
            status: true,
            initialViews: true,
            createdAt: true,
            users: {
              select: {
                name: true,
                image: true
              }
            },
            socialAccount: {
              select: {
                username: true,
                platform: true
              }
            },
            clips: {
              select: {
                views: true,
                view_tracking: {
                  orderBy: { scrapedAt: 'desc' },
                  take: 1,
                  select: {
                    views: true,
                    scrapedAt: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Calculate stats
    const totalSubmissions = campaign._count.clipSubmissions
    const approvedSubmissions = campaign.clipSubmissions.length
    
    // Use budgetReachedViews as a snapshot of views when campaign budget was reached
    const budgetReachedViews = Number(campaign.budgetReachedViews || 0)
    
    // Calculate total views and views gained
    let totalViews = 0
    let viewsDuringCampaign = 0
    let viewsAfterCampaign = 0
    
    const processedSubmissions = campaign.clipSubmissions.map(sub => {
      const initialViews = Number(sub.initialViews || 0)
      const currentViews = Number(sub.clips?.views || 0)
      const viewsGained = Math.max(0, currentViews - initialViews)
      
      totalViews += currentViews
      viewsDuringCampaign += viewsGained
      
      return {
        id: sub.id,
        clipUrl: sub.clipUrl,
        platform: sub.platform,
        status: sub.status,
        creatorHandle: sub.socialAccount?.username || sub.users.name || 'Unknown',
        creatorImage: sub.users.image,
        initialViews,
        currentViews,
        viewsGained,
        submittedAt: sub.createdAt
      }
    })

    // Sort by views gained (highest first)
    processedSubmissions.sort((a, b) => b.viewsGained - a.viewsGained)

    // Calculate budget utilization
    const budgetNum = Number(campaign.budget || 0)
    const spentNum = Number(campaign.spent || 0)
    const budgetUtilization = budgetNum > 0 ? (spentNum / budgetNum) * 100 : 0
    const remainingBudget = Math.max(0, budgetNum - spentNum)
    
    // Calculate views after campaign if we have budget reached data
    if (budgetReachedViews > 0 && totalViews > budgetReachedViews) {
      viewsAfterCampaign = totalViews - budgetReachedViews
      viewsDuringCampaign = budgetReachedViews
    }

    // Platform breakdown
    const platformStats = processedSubmissions.reduce((acc, sub) => {
      const platform = sub.platform
      if (!acc[platform]) {
        acc[platform] = { count: 0, views: 0, viewsGained: 0 }
      }
      acc[platform].count++
      acc[platform].views += sub.currentViews
      acc[platform].viewsGained += sub.viewsGained
      return acc
    }, {} as Record<string, { count: number; views: number; viewsGained: number }>)

    return NextResponse.json({
      campaign: {
        id: campaign.id,
        title: campaign.title,
        description: campaign.description,
        creator: campaign.creator,
        status: campaign.status,
        targetPlatforms: campaign.targetPlatforms,
        featuredImage: campaign.featuredImage,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        completedAt: campaign.completedAt,
        createdAt: campaign.createdAt
      },
      stats: {
        budget: budgetNum,
        spent: spentNum,
        remainingBudget,
        budgetUtilization: Math.min(budgetUtilization, 100),
        totalSubmissions,
        approvedSubmissions,
        totalViews,
        viewsDuringCampaign,
        viewsAfterCampaign,
        payoutRate: Number(campaign.payoutRate)
      },
      platformStats,
      submissions: processedSubmissions.slice(0, 50) // Limit to top 50 for performance
    })
  } catch (error) {
    console.error("Error fetching client portal data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

