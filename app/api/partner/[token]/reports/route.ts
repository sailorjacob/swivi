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
        creator: true,
        status: true,
        budget: true,
        spent: true,
        targetPlatforms: true,
        featuredImage: true,
        startDate: true,
        completedAt: true,
        createdAt: true,
        clipSubmissions: {
          select: {
            id: true,
            status: true,
            userId: true,
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
      let approvedCount = 0
      const uniqueCreators = new Set<string>()

      campaign.clipSubmissions.forEach(sub => {
        if (sub.status === 'APPROVED' || sub.status === 'PAID') {
          approvedCount++
          totalViews += Number(sub.clips?.views || 0)
        }
        if (sub.userId) {
          uniqueCreators.add(sub.userId)
        }
      })

      return {
        id: campaign.id,
        title: campaign.title,
        status: campaign.status,
        budget: Number(campaign.budget || 0),
        spent: Number(campaign.spent || 0),
        targetPlatforms: campaign.targetPlatforms,
        featuredImage: campaign.featuredImage,
        startDate: campaign.startDate?.toISOString() || null,
        completedAt: campaign.completedAt?.toISOString() || null,
        createdAt: campaign.createdAt.toISOString(),
        stats: {
          totalViews,
          approvedSubmissions: approvedCount,
          totalSubmissions: campaign.clipSubmissions.length,
          uniqueCreators: uniqueCreators.size
        },
        hasFullReport: campaign.clipSubmissions.length > 0
      }
    })

    return NextResponse.json({
      partnerName,
      campaigns: formattedCampaigns
    })
  } catch (error) {
    console.error("Error fetching partner reports:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
