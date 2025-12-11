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

    // Find campaigns with this token
    const campaigns = await prisma.campaign.findMany({
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
        endDate: true,
        completedAt: true,
        createdAt: true,
        _count: {
          select: {
            clipSubmissions: true
          }
        },
        clipSubmissions: {
          select: {
            id: true,
            status: true,
            initialViews: true,
            clips: {
              select: {
                views: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (campaigns.length === 0) {
      return NextResponse.json({ error: "No campaigns found" }, { status: 404 })
    }

    const partnerName = campaigns[0].creator || "Partner"

    const formattedCampaigns = campaigns.map(campaign => {
      let totalViews = 0
      let viewsGained = 0
      let approvedCount = 0

      campaign.clipSubmissions.forEach(sub => {
        if (sub.status === 'APPROVED' || sub.status === 'PAID') {
          approvedCount++
          const views = Number(sub.clips?.views || 0)
          const initial = Number(sub.initialViews || 0)
          totalViews += views
          viewsGained += Math.max(0, views - initial)
        }
      })

      return {
        id: campaign.id,
        title: campaign.title,
        description: campaign.description || '',
        status: campaign.status,
        budget: Number(campaign.budget || 0),
        spent: Number(campaign.spent || 0),
        payoutRate: Number(campaign.payoutRate || 0),
        targetPlatforms: campaign.targetPlatforms,
        featuredImage: campaign.featuredImage,
        startDate: campaign.startDate?.toISOString() || null,
        endDate: campaign.endDate?.toISOString() || null,
        completedAt: campaign.completedAt?.toISOString() || null,
        createdAt: campaign.createdAt.toISOString(),
        stats: {
          totalSubmissions: campaign._count.clipSubmissions,
          approvedSubmissions: approvedCount,
          totalViews,
          viewsGained
        }
      }
    })

    return NextResponse.json({
      partnerName,
      campaigns: formattedCampaigns
    })
  } catch (error) {
    console.error("Error fetching partner campaigns:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
