import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole()

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = user.id

    // Get user's real stats
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalViews: true,
        totalEarnings: true,
        submissions: {
          select: {
            id: true,
            status: true,
            payout: true,
            clipUrl: true,
            platform: true,
            createdAt: true,
            campaign: {
              select: {
                title: true,
                creator: true
              }
            },
            clip: {
              select: {
                id: true,
                title: true,
                viewTracking: {
                  orderBy: { date: "desc" },
                  take: 1
                }
              }
            }
          },
          orderBy: { createdAt: "desc" },
          take: 10
        }
      }
    })

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get active campaigns count
    const activeCampaigns = await prisma.campaign.count({
      where: { status: "ACTIVE" }
    })

    // Calculate real stats
    const totalSubmissions = userData.submissions.length
    const approvedSubmissions = userData.submissions.filter(s => s.status === "APPROVED" || s.status === "PAID").length
    const pendingSubmissions = userData.submissions.filter(s => s.status === "PENDING").length

    // Get recent clips with proper data structure
    const recentClips = userData.submissions.map(submission => {
      const latestTracking = submission.clip?.viewTracking[0]
      return {
        id: submission.id,
        title: submission.clip?.title || submission.clipUrl,
        campaign: submission.campaign.title,
        status: submission.status.toLowerCase(),
        submittedAt: submission.createdAt.toISOString().split('T')[0],
        views: latestTracking ? Number(latestTracking.views) : 0,
        earnings: submission.status === "PAID" ? Number(submission.payout || 0) : 0,
        clipUrl: submission.clipUrl,
        platform: submission.platform
      }
    })

    const stats = [
      {
        title: "Total Earned",
        value: `$${Number(userData.totalEarnings).toFixed(2)}`,
        change: approvedSubmissions > 0 ? `${approvedSubmissions} approved clips` : "Start earning from approved clips",
        changeType: approvedSubmissions > 0 ? "positive" : "neutral" as const,
        icon: "DollarSign",
        color: "text-foreground"
      },
      {
        title: "Active Campaigns",
        value: activeCampaigns.toString(),
        change: "Available to join",
        changeType: "neutral" as const,
        icon: "Target",
        color: "text-muted-foreground"
      },
      {
        title: "Clips Submitted",
        value: totalSubmissions.toString(),
        change: pendingSubmissions > 0 ? `${pendingSubmissions} pending approval` : "Submit your first clip",
        changeType: pendingSubmissions > 0 ? "neutral" : "neutral" as const,
        icon: "Play",
        color: "text-muted-foreground"
      },
      {
        title: "Total Views",
        value: Number(userData.totalViews).toLocaleString(),
        change: "Grow your audience",
        changeType: "neutral" as const,
        icon: "Eye",
        color: "text-muted-foreground"
      }
    ]

    return NextResponse.json({
      stats,
      recentClips,
      activeCampaigns: activeCampaigns
    })

  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
