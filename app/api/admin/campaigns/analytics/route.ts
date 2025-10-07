import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { ViewTrackingService } from "@/lib/view-tracking"

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole()

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

    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get("campaignId")

    // Get overall analytics
    const [
      totalCampaigns,
      activeCampaigns,
      totalSubmissions,
      totalViews,
      totalEarnings,
      recentSubmissions
    ] = await Promise.all([
      // Total campaigns
      prisma.campaign.count(),

      // Active campaigns
      prisma.campaign.count({
        where: { status: "ACTIVE" }
      }),

      // Total submissions
      prisma.clipSubmission.count(),

      // Total views across all users
      prisma.user.aggregate({
        _sum: {
          totalViews: true
        }
      }),

      // Total earnings across all users
      prisma.user.aggregate({
        _sum: {
          totalEarnings: true
        }
      }),

      // Recent submissions (last 7 days)
      prisma.clipSubmission.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          campaign: true,
          users: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 10
      })
    ])

    const analytics: {
      overview: {
        totalCampaigns: number
        activeCampaigns: number
        totalSubmissions: number
        totalViews: number | bigint
        totalEarnings: number
      }
      recentSubmissions: any[]
      campaignDetails?: any
    } = {
      overview: {
        totalCampaigns,
        activeCampaigns,
        totalSubmissions,
        totalViews: totalViews._sum.totalViews || 0,
        totalEarnings: Number(totalEarnings._sum.totalEarnings || 0)
      },
      recentSubmissions
    }

    // If specific campaign requested, get detailed stats
    if (campaignId) {
      const viewTrackingService = new ViewTrackingService(process.env.APIFY_API_KEY || "")
      const campaignStats = await viewTrackingService.getCampaignViewStats(campaignId)

      analytics.campaignDetails = campaignStats
    }

    return NextResponse.json(analytics)

  } catch (error) {
    console.error("Error fetching campaign analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
