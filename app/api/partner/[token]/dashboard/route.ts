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

    // Find the campaign with this token
    const campaign = await prisma.campaign.findFirst({
      where: { clientAccessToken: token },
      select: {
        id: true,
        title: true,
        description: true,
        creator: true,
        status: true,
        budget: true,
        spent: true,
        payoutRate: true,
        targetPlatforms: true,
        featuredImage: true,
        startDate: true,
        completedAt: true,
        createdAt: true,
        clipSubmissions: {
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
            clips: {
              select: {
                views: true
              }
            }
          }
        }
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: "Invalid access token" }, { status: 404 })
    }

    const partnerName = campaign.creator || "Partner"

    // Calculate stats and process submissions
    const budget = Number(campaign.budget || 0)
    const spent = Number(campaign.spent || 0)
    const budgetUtilization = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0

    let totalViews = 0
    let totalViewsGained = 0
    let approvedCount = 0
    const platformStats: Record<string, { count: number; views: number; viewsGained: number }> = {}

    // Process all submissions, filter to approved for display
    const approvedSubmissions = campaign.clipSubmissions
      .filter(sub => sub.status === 'APPROVED' || sub.status === 'PAID')
      .map(sub => {
        const initialViews = Number(sub.initialViews || 0)
        const currentViews = Number(sub.clips?.views || 0)
        const viewsGained = Math.max(0, currentViews - initialViews)

        totalViews += currentViews
        totalViewsGained += viewsGained
        approvedCount++

        // Platform stats
        const platform = sub.platform
        if (!platformStats[platform]) {
          platformStats[platform] = { count: 0, views: 0, viewsGained: 0 }
        }
        platformStats[platform].count++
        platformStats[platform].views += currentViews
        platformStats[platform].viewsGained += viewsGained

        return {
          id: sub.id,
          clipUrl: sub.clipUrl,
          platform: sub.platform,
          status: sub.status,
          creatorName: sub.users.name || 'Creator',
          creatorImage: sub.users.image,
          initialViews,
          currentViews,
          viewsGained,
          submittedAt: sub.createdAt.toISOString()
        }
      })

    // Sort by views (highest first)
    approvedSubmissions.sort((a, b) => b.currentViews - a.currentViews)

    return NextResponse.json({
      partnerName,
      campaign: {
        id: campaign.id,
        title: campaign.title,
        description: campaign.description || '',
        status: campaign.status,
        targetPlatforms: campaign.targetPlatforms,
        featuredImage: campaign.featuredImage,
        startDate: campaign.startDate?.toISOString() || null,
        completedAt: campaign.completedAt?.toISOString() || null,
        createdAt: campaign.createdAt.toISOString()
      },
      stats: {
        budget,
        spent,
        budgetUtilization,
        totalSubmissions: campaign.clipSubmissions.length,
        approvedSubmissions: approvedCount,
        totalViews,
        totalViewsGained,
        payoutRate: Number(campaign.payoutRate || 0)
      },
      platformStats,
      submissions: approvedSubmissions
    })
  } catch (error) {
    console.error("Error fetching partner dashboard:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
