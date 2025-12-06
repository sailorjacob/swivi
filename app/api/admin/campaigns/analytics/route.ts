// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { ViewTrackingService } from "@/lib/view-tracking-service"

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

    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get("campaignId")

    // Get overall analytics
    const [
      totalCampaigns,
      activeCampaigns,
      totalSubmissions,
      totalEarnings,
      recentSubmissions,
      // Get real-time view counts from view_tracking records
      approvedSubmissionsWithViews
    ] = await Promise.all([
      // Total campaigns
      prisma.campaign.count(),

      // Active campaigns
      prisma.campaign.count({
        where: { status: "ACTIVE" }
      }),

      // Total submissions
      prisma.clipSubmission.count(),

      // Total earnings from clip.earnings (not user.totalEarnings which includes deducted payouts)
      prisma.clip.aggregate({
        where: {
          clipSubmissions: {
            some: {
              status: { in: ['APPROVED', 'PAID'] }
            }
          }
        },
        _sum: {
          earnings: true
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
      }),

      // Real-time views calculation from view_tracking
      prisma.clipSubmission.findMany({
        where: {
          status: { in: ['APPROVED', 'PAID'] }
        },
        select: {
          initialViews: true,
          clips: {
            select: {
              view_tracking: {
                orderBy: { date: 'desc' },
                take: 1,
                select: {
                  views: true
                }
              }
            }
          }
        }
      })
    ])

    // Calculate real-time tracked views (views gained since submission)
    const totalTrackedViews = approvedSubmissionsWithViews.reduce((sum, submission) => {
      const latestViews = submission.clips?.view_tracking?.[0]
        ? Number(submission.clips.view_tracking[0].views || 0)
        : 0
      const initialViews = Number(submission.initialViews || 0)
      const viewsGained = Math.max(0, latestViews - initialViews)
      return sum + viewsGained
    }, 0)

    const analytics: {
      overview: {
        totalCampaigns: number
        activeCampaigns: number
        totalSubmissions: number
        totalViews: number
        totalEarnings: number
      }
      recentSubmissions: any[]
      campaignDetails?: any
    } = {
      overview: {
        totalCampaigns,
        activeCampaigns,
        totalSubmissions,
        totalViews: totalTrackedViews,
        totalEarnings: Number(totalEarnings._sum.earnings || 0)
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
