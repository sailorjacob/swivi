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

    // Need to get all submissions for total counts per platform
    const allSubmissions = await prisma.clipSubmission.findMany({
      where: { campaignId: campaign.id },
      select: {
        platform: true
      }
    })
    
    // Calculate stats
    const totalSubmissions = campaign._count.clipSubmissions
    const approvedSubmissions = campaign.clipSubmissions.length
    
    // Use budgetReachedViews as a snapshot of views when campaign budget was reached
    const budgetReachedViews = Number(campaign.budgetReachedViews || 0)
    
    // Calculate total views and views gained
    let totalViews = 0
    let viewsDuringCampaign = 0
    let viewsAfterCampaign = 0
    
    // Initialize platform stats with total submission counts
    const platformStats: Record<string, { 
      totalSubmissions: number
      approvedSubmissions: number
      totalViews: number
      budgetViews: number
      additionalViews: number
    }> = {}
    
    allSubmissions.forEach(sub => {
      const platform = sub.platform
      if (!platformStats[platform]) {
        platformStats[platform] = { 
          totalSubmissions: 0, 
          approvedSubmissions: 0, 
          totalViews: 0,
          budgetViews: 0,
          additionalViews: 0
        }
      }
      platformStats[platform].totalSubmissions++
    })
    
    const processedSubmissions = campaign.clipSubmissions.map(sub => {
      const initialViews = Number(sub.initialViews || 0)
      const currentViews = Number(sub.clips?.views || 0)
      const viewsGained = Math.max(0, currentViews - initialViews)
      
      totalViews += currentViews
      viewsDuringCampaign += viewsGained
      
      // Platform stats for approved submissions
      const platform = sub.platform
      if (!platformStats[platform]) {
        platformStats[platform] = { 
          totalSubmissions: 0, 
          approvedSubmissions: 0, 
          totalViews: 0,
          budgetViews: 0,
          additionalViews: 0
        }
      }
      platformStats[platform].approvedSubmissions++
      platformStats[platform].totalViews += currentViews
      
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
      
      // Proportionally split views per platform based on the overall ratio
      const budgetRatio = budgetReachedViews / totalViews
      Object.keys(platformStats).forEach(platform => {
        const platformTotalViews = platformStats[platform].totalViews
        platformStats[platform].budgetViews = Math.round(platformTotalViews * budgetRatio)
        platformStats[platform].additionalViews = platformTotalViews - platformStats[platform].budgetViews
      })
    } else {
      // No budget reached data, all views are budget views
      Object.keys(platformStats).forEach(platform => {
        platformStats[platform].budgetViews = platformStats[platform].totalViews
        platformStats[platform].additionalViews = 0
      })
    }

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

