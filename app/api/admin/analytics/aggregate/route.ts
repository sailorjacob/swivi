// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { RateLimitingService } from "@/lib/rate-limiting-service"

export async function GET(request: NextRequest) {
  try {
    // Rate limiting check for admin analytics
    const rateLimitingService = RateLimitingService.getInstance()
    const rateLimitResult = await rateLimitingService.checkRateLimit(
      'admin:analytics',
      request.ip || 'unknown'
    )

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      )
    }

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
    const userId = searchParams.get("userId")

    // Check if we should include test/deleted data
    const includeTest = searchParams.get("includeTest") === "true"
    const includeDeleted = searchParams.get("includeDeleted") === "true"
    
    // Base filter for real campaigns (exclude test and deleted by default)
    const realCampaignFilter = {
      ...(includeDeleted ? {} : { deletedAt: null }),
      ...(includeTest ? {} : { isTest: false })
    }

    // Get overall platform statistics
    const [
      totalUsers,
      totalCampaigns,
      totalSubmissions,
      activeCampaigns,
      testCampaigns,
      archivedCampaigns
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Total campaigns (only real, non-deleted)
      prisma.campaign.count({
        where: realCampaignFilter
      }),

      // Total submissions (from real campaigns only)
      prisma.clipSubmission.count({
        where: {
          campaigns: realCampaignFilter
        }
      }),

      // Active campaigns
      prisma.campaign.count({
        where: { 
          status: "ACTIVE",
          ...realCampaignFilter
        }
      }),
      
      // Test campaigns count (for admin info)
      prisma.campaign.count({
        where: { isTest: true, deletedAt: null }
      }),
      
      // Archived campaigns count
      prisma.campaign.count({
        where: { deletedAt: { not: null } }
      })
    ])

    // Calculate REAL-TIME totals from actual clips (not cached User values)
    // Only from real campaigns (exclude test and deleted)
    const allApprovedSubmissions = await prisma.clipSubmission.findMany({
      where: {
        status: 'APPROVED',
        campaigns: realCampaignFilter
      },
      select: {
        clips: {
          select: {
            earnings: true,
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

    // Calculate real-time totals
    const totalEarnings = allApprovedSubmissions.reduce((sum, submission) => {
      return sum + Number(submission.clips?.earnings || 0)
    }, 0)

    const totalViews = allApprovedSubmissions.reduce((sum, submission) => {
      if (submission.clips?.view_tracking?.[0]) {
        return sum + Number(submission.clips.view_tracking[0].views || 0)
      }
      return sum
    }, 0)

    // Get top performing campaigns (real campaigns only)
    const topCampaigns = await prisma.campaign.findMany({
      where: realCampaignFilter,
      take: 10,
      orderBy: {
        spent: "desc"
      },
      select: {
        id: true,
        title: true,
        status: true,
        isTest: true,
        budget: true,
        spent: true,
        _count: {
          select: {
            clipSubmissions: true
          }
        }
      }
    })

    // Get tracked views per campaign (real campaigns only)
    // Includes approved submissions for view tracking AND total submission count
    const campaignsWithTrackedViews = await prisma.campaign.findMany({
      where: realCampaignFilter,
      select: {
        id: true,
        title: true,
        status: true,
        isTest: true,
        featuredImage: true,
        _count: {
          select: {
            clipSubmissions: true // Total ALL submissions count
          }
        },
        clipSubmissions: {
          where: {
            status: 'APPROVED'
          },
          select: {
            id: true,
            initialViews: true,
            clips: {
              select: {
                id: true,
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
        }
      }
    })

    // Calculate tracked views for each campaign
    const campaignTrackedViews = campaignsWithTrackedViews.map(campaign => {
      let totalTrackedViews = 0
      let totalInitialViews = 0
      let totalCurrentViews = 0
      
      campaign.clipSubmissions.forEach(submission => {
        const initialViews = Number(submission.initialViews || 0)
        const currentViews = submission.clips?.view_tracking?.[0] 
          ? Number(submission.clips.view_tracking[0].views || 0) 
          : initialViews
        
        totalInitialViews += initialViews
        totalCurrentViews += currentViews
        totalTrackedViews += Math.max(0, currentViews - initialViews)
      })

      return {
        campaignId: campaign.id,
        campaignTitle: campaign.title,
        campaignStatus: campaign.status,
        campaignImage: campaign.featuredImage,
        totalSubmissions: campaign._count.clipSubmissions, // ALL submissions, not just approved
        approvedSubmissions: campaign.clipSubmissions.length, // Approved only (for view tracking)
        trackedViews: totalTrackedViews,
        initialViews: totalInitialViews,
        currentViews: totalCurrentViews
      }
    }).filter(c => c.totalSubmissions > 0) // Only include campaigns with submissions
      .sort((a, b) => b.trackedViews - a.trackedViews) // Sort by tracked views

    // Get platform breakdown (from real campaigns only)
    const platformBreakdown = await prisma.clipSubmission.groupBy({
      by: ['platform'],
      where: {
        campaigns: realCampaignFilter
      },
      _count: {
        platform: true
      }
    })

    // Get payout statistics - Real-time from PayoutRequest table
    const [completedPayouts, pendingPayoutRequests] = await Promise.all([
      prisma.payout.aggregate({
        _sum: { amount: true },
        _count: true
      }),
      prisma.payoutRequest.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true }
      })
    ])

    // Calculate total tracked views from campaign breakdown (sum of all tracked views)
    const totalTrackedViews = campaignTrackedViews.reduce((sum, campaign) => sum + campaign.trackedViews, 0)

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
      campaignTrackedViews?: any[]
    } = {
      overview: {
        totalUsers,
        totalCampaigns,
        totalSubmissions,
        activeCampaigns,
        testCampaigns, // Test campaigns (excluded from stats)
        archivedCampaigns, // Archived/deleted campaigns
        totalViews: totalViews, // Real-time from clips
        trackedViews: totalTrackedViews, // Total tracked views (current - initial)
        totalEarnings: totalEarnings, // Real-time from clips
        pendingSubmissions: 0, // We'll calculate these from submissions
        approvedSubmissions: 0,
        rejectedSubmissions: 0,
        paidSubmissions: 0
      },
      topCampaigns: topCampaigns.map(campaign => ({
        id: campaign.id,
        title: campaign.title,
        status: campaign.status,
        submissions: campaign._count.clipSubmissions,
        views: 0, // Would need to calculate from submissions
        earnings: Number(campaign.spent || 0)
      })),
      platformBreakdown: platformBreakdown.reduce((acc, item) => {
        acc[item.platform] = item._count.platform
        return acc
      }, {} as Record<string, number>),
      payoutStats: {
        totalPaid: Number(completedPayouts._sum.amount || 0),
        pendingPayouts: Number(pendingPayoutRequests._sum.amount || 0),
        averagePayout: completedPayouts._count > 0 ? Number(completedPayouts._sum.amount || 0) / completedPayouts._count : 0
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
        case 'REJECTED':
          platformStats.overview.rejectedSubmissions = item._count.status
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
          users: {
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
        if (submission.clips?.viewTracking && submission.clips.viewTracking.length > 0) {
          return sum + Number(submission.clips.viewTracking[0]?.views || 0)
        }
        return sum
      }, 0)

      const totalCampaignEarnings = campaignSubmissions
        .filter(s => s.clips)
        .reduce((sum, s) => sum + Number(s.clips?.earnings || 0), 0)

      const topPerformers = campaignSubmissions
        .filter(submission => submission.clips?.viewTracking && submission.clips.viewTracking.length > 0)
        .map(submission => ({
          userId: submission.users.id,
          userName: submission.users.name || submission.users.email || 'Unknown',
          views: Number(submission.clips?.viewTracking[0]?.views || 0),
          earnings: Number(submission.clips?.earnings || 0),
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
        where: { supabaseAuthId: userId },
        include: {
          clipSubmissions: {
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
        const totalUserViews = userStats.clipSubmissions.reduce((sum, submission) => {
          if (submission.clip?.viewTracking && submission.clip.viewTracking.length > 0) {
            return sum + Number(submission.clip.viewTracking[0]?.views || 0)
          }
          return sum
        }, 0)

        const totalUserEarnings = userStats.clipSubmissions
          .filter(s => s.clip)
          .reduce((sum, s) => sum + Number(s.clip?.earnings || 0), 0)

        const recentSubmissions = userStats.clipSubmissions
          .filter(submission => submission.clip?.viewTracking && submission.clip.viewTracking.length > 0)
          .map(submission => ({
            campaignTitle: submission.campaign.title,
            platform: submission.platform,
            views: Number(submission.clip?.viewTracking[0]?.views || 0),
            earnings: Number(submission.clip?.earnings || 0),
            status: submission.status,
            submittedAt: submission.createdAt
          }))
          .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
          .slice(0, 10)

        platformStats.userDetails = {
          name: userStats.name || 'Unknown',
          email: userStats.email,
          totalViews: Number(userStats.totalViews || 0),
          totalEarnings: Number(userStats.totalEarnings || 0),
          activeSubmissions: userStats.clipSubmissions.length,
          recentSubmissions
        }
      }
    }

    // Add campaign tracked views breakdown
    platformStats.campaignTrackedViews = campaignTrackedViews

    return NextResponse.json(platformStats)

  } catch (error) {
    console.error("Error fetching aggregated analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
