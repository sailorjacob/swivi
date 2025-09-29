import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get("campaignId")
    const userId = searchParams.get("userId")

    // Get overall platform statistics
    const [
      totalUsers,
      totalCampaigns,
      totalSubmissions,
      activeCampaigns,
      totalViews,
      totalEarnings
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Total campaigns
      prisma.campaign.count(),

      // Total submissions
      prisma.clipSubmission.count(),

      // Active campaigns
      prisma.campaign.count({
        where: { status: "ACTIVE" }
      }),

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
      })
    ])

    // Get top performing campaigns
    const topCampaigns = await prisma.campaign.findMany({
      take: 10,
      orderBy: {
        spent: "desc"
      },
      select: {
        id: true,
        title: true,
        status: true,
        budget: true,
        spent: true,
        _count: {
          select: {
            submissions: true
          }
        }
      }
    })

    // Get platform breakdown
    const platformBreakdown = await prisma.clipSubmission.groupBy({
      by: ['platform'],
      _count: {
        platform: true
      }
    })

    // Get payout statistics
    const paidSubmissions = await prisma.clipSubmission.aggregate({
      where: { status: 'PAID' },
      _sum: { payout: true },
      _count: true
    })

    const pendingSubmissions = await prisma.clipSubmission.count({
      where: { status: 'APPROVED' }
    })

    const platformStats: {
      overview: any
      campaignDetails?: any
      userDetails?: any
      topCampaigns: any[]
      platformBreakdown: Record<string, number>
      payoutStats: {
        totalPaid: number
        pendingPayouts: number
        averagePayout: number
      }
    } = {
      overview: {
        totalUsers,
        totalCampaigns,
        totalSubmissions,
        activeCampaigns,
        totalViews: totalViews._sum.totalViews || 0,
        totalEarnings: Number(totalEarnings._sum.totalEarnings || 0),
        pendingSubmissions: 0, // We'll calculate these from submissions
        approvedSubmissions: 0,
        paidSubmissions: 0
      },
      topCampaigns: topCampaigns.map(campaign => ({
        id: campaign.id,
        title: campaign.title,
        status: campaign.status,
        submissions: campaign._count.submissions,
        views: 0, // Would need to calculate from submissions
        earnings: campaign.spent
      })),
      platformBreakdown: platformBreakdown.reduce((acc, item) => {
        acc[item.platform] = item._count.platform
        return acc
      }, {} as Record<string, number>),
      payoutStats: {
        totalPaid: Number(paidSubmissions._sum.payout || 0),
        pendingPayouts: pendingSubmissions * 0, // For now, assuming no pending payouts
        averagePayout: paidSubmissions._count > 0 ? Number(paidSubmissions._sum.payout || 0) / paidSubmissions._count : 0
      }
    }

    // Calculate submission status counts
    const submissionStatuses = await prisma.clipSubmission.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })

    submissionStatuses.forEach(item => {
      switch (item.status) {
        case 'PENDING':
          platformStats.overview.pendingSubmissions = item._count.status
          break
        case 'APPROVED':
          platformStats.overview.approvedSubmissions = item._count.status
          break
        case 'PAID':
          platformStats.overview.paidSubmissions = item._count.status
          break
      }
    })

    // If specific campaign requested, get detailed stats
    if (campaignId) {
      const campaignSubmissions = await prisma.clipSubmission.findMany({
        where: {
          campaignId,
          status: {
            in: ['APPROVED', 'PAID']
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              totalViews: true,
              totalEarnings: true
            }
          },
          clip: {
            include: {
              viewTracking: {
                orderBy: {
                  date: "desc"
                }
              }
            }
          }
        }
      })

      const totalCampaignViews = campaignSubmissions.reduce((sum, submission) => {
        if (submission.clip?.viewTracking && submission.clip.viewTracking.length > 0) {
          return sum + Number(submission.clip.viewTracking[0]?.views || 0)
        }
        return sum
      }, 0)

      const totalCampaignEarnings = campaignSubmissions
        .filter(s => s.status === 'PAID' && s.payout)
        .reduce((sum, s) => sum + Number(s.payout || 0), 0)

      const topPerformers = campaignSubmissions
        .filter(submission => submission.clip?.viewTracking && submission.clip.viewTracking.length > 0)
        .map(submission => ({
          userId: submission.user.id,
          userName: submission.user.name || submission.user.email || 'Unknown',
          views: Number(submission.clip?.viewTracking[0]?.views || 0),
          earnings: Number(submission.payout || 0),
          submissionId: submission.id
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10)

      platformStats.campaignDetails = {
        totalSubmissions: campaignSubmissions.length,
        totalViews: totalCampaignViews,
        totalEarnings: totalCampaignEarnings,
        averageViewsPerSubmission: campaignSubmissions.length > 0 ? totalCampaignViews / campaignSubmissions.length : 0,
        topPerformers
      }
    }

    // If specific user requested, get user stats
    if (userId) {
      const userStats = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          submissions: {
            where: {
              status: {
                in: ['APPROVED', 'PAID']
              }
            },
            include: {
              campaign: {
                select: {
                  id: true,
                  title: true,
                  creator: true
                }
              },
              clip: {
                include: {
                  viewTracking: {
                    orderBy: {
                      date: "desc"
                    }
                  }
                }
              }
            }
          }
        }
      })

      if (userStats) {
        const totalUserViews = userStats.submissions.reduce((sum, submission) => {
          if (submission.clip?.viewTracking && submission.clip.viewTracking.length > 0) {
            return sum + Number(submission.clip.viewTracking[0]?.views || 0)
          }
          return sum
        }, 0)

        const totalUserEarnings = userStats.submissions
          .filter(s => s.status === 'PAID' && s.payout)
          .reduce((sum, s) => sum + Number(s.payout || 0), 0)

        const recentSubmissions = userStats.submissions
          .filter(submission => submission.clip?.viewTracking && submission.clip.viewTracking.length > 0)
          .map(submission => ({
            campaignTitle: submission.campaign.title,
            platform: submission.platform,
            views: Number(submission.clip?.viewTracking[0]?.views || 0),
            earnings: Number(submission.payout || 0),
            status: submission.status,
            submittedAt: submission.createdAt
          }))
          .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
          .slice(0, 10)

        platformStats.userDetails = {
          name: userStats.name || 'Unknown',
          email: userStats.email,
          totalViews: userStats.totalViews,
          totalEarnings: Number(userStats.totalEarnings),
          activeSubmissions: userStats.submissions.length,
          recentSubmissions
        }
      }
    }

    return NextResponse.json(platformStats)

  } catch (error) {
    console.error("Error fetching aggregated analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
