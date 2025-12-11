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

    // Find campaign by client access token with ALL data for report
    const campaign = await prisma.campaign.findUnique({
      where: { clientAccessToken: token },
      select: {
        id: true,
        title: true,
        description: true,
        creator: true,
        budget: true,
        spent: true,
        reservedAmount: true,
        payoutRate: true,
        startDate: true,
        endDate: true,
        status: true,
        targetPlatforms: true,
        featuredImage: true,
        completedAt: true,
        completionReason: true,
        // budgetReachedAt and budgetReachedViews may not exist yet
        createdAt: true,
        _count: {
          select: {
            clipSubmissions: true
          }
        },
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
                id: true,
                name: true,
                image: true
              }
            },
            socialAccount: {
              select: {
                platform: true,
                username: true,
                displayName: true,
                verified: true
              }
            },
            clips: {
              select: {
                views: true,
                earnings: true,
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

    // Process all submissions with stats
    const allSubmissions = campaign.clipSubmissions.map(sub => {
      const initialViews = Number(sub.initialViews || 0)
      const currentViews = Number(sub.clips?.views || 0)
      const viewsGained = Math.max(0, currentViews - initialViews)
      const earnings = Number(sub.clips?.earnings || 0)
      const socialAccount = sub.socialAccount
      
      return {
        id: sub.id,
        clipUrl: sub.clipUrl,
        platform: sub.platform,
        status: sub.status,
        creatorId: sub.users.id,
        creatorName: sub.users.name || 'Anonymous',
        creatorImage: sub.users.image,
        handle: socialAccount?.username || sub.users.name?.split(' ')[0] || 'unknown',
        isVerified: socialAccount?.verified || false,
        initialViews,
        currentViews,
        viewsGained,
        earnings,
        submittedAt: sub.createdAt,
        lastTracked: sub.clips?.view_tracking?.[0]?.scrapedAt || null
      }
    })

    // Filter approved submissions
    const approvedSubmissions = allSubmissions.filter(s => s.status === 'APPROVED' || s.status === 'PAID')

    // Calculate totals
    const totalViews = approvedSubmissions.reduce((sum, s) => sum + s.currentViews, 0)
    const totalViewsGained = approvedSubmissions.reduce((sum, s) => sum + s.viewsGained, 0)
    const totalEarnings = approvedSubmissions.reduce((sum, s) => sum + s.earnings, 0)

    // Aggregate by creator handle
    const creatorStatsMap = new Map<string, {
      handle: string
      platform: string
      creatorName: string
      isVerified: boolean
      clipCount: number
      approvedCount: number
      totalViews: number
      approvedViews: number
      totalEarnings: number
    }>()

    for (const sub of allSubmissions) {
      const key = `${sub.platform}:${sub.handle}`
      const existing = creatorStatsMap.get(key)
      
      if (existing) {
        existing.clipCount++
        existing.totalViews += sub.currentViews // Track views for all submissions
        if (sub.status === 'APPROVED' || sub.status === 'PAID') {
          existing.approvedCount++
          existing.approvedViews += sub.currentViews
          existing.totalEarnings += sub.earnings
        }
      } else {
        creatorStatsMap.set(key, {
          handle: sub.handle,
          platform: sub.platform,
          creatorName: sub.creatorName,
          isVerified: sub.isVerified,
          clipCount: 1,
          approvedCount: (sub.status === 'APPROVED' || sub.status === 'PAID') ? 1 : 0,
          totalViews: sub.currentViews, // Track views for all submissions
          approvedViews: (sub.status === 'APPROVED' || sub.status === 'PAID') ? sub.currentViews : 0,
          totalEarnings: (sub.status === 'APPROVED' || sub.status === 'PAID') ? sub.earnings : 0
        })
      }
    }

    const creatorBreakdown = Array.from(creatorStatsMap.values())
      .filter(c => c.approvedCount > 0) // Only show creators with approved content
      .sort((a, b) => b.totalViews - a.totalViews)
    
    // Non-participating pages (no approved content)
    const nonParticipatingPages = Array.from(creatorStatsMap.values())
      .filter(c => c.approvedCount === 0) // Pages with no approved content
      .sort((a, b) => b.clipCount - a.clipCount)

    // Platform breakdown
    const platformBreakdown = allSubmissions.reduce((acc, sub) => {
      const platform = sub.platform
      if (!acc[platform]) {
        acc[platform] = { total: 0, approved: 0, pending: 0, rejected: 0, views: 0, earnings: 0 }
      }
      acc[platform].total++
      if (sub.status === 'APPROVED' || sub.status === 'PAID') {
        acc[platform].approved++
        acc[platform].views += sub.currentViews
        acc[platform].earnings += sub.earnings
      } else if (sub.status === 'PENDING') {
        acc[platform].pending++
      } else if (sub.status === 'REJECTED') {
        acc[platform].rejected++
      }
      return acc
    }, {} as Record<string, { total: number, approved: number, pending: number, rejected: number, views: number, earnings: number }>)

    // Top performing clips (by views)
    const topClips = [...approvedSubmissions]
      .sort((a, b) => b.currentViews - a.currentViews)
      .slice(0, 10)
      .map(s => ({
        clipUrl: s.clipUrl,
        platform: s.platform,
        handle: s.handle,
        views: s.currentViews,
        earnings: s.earnings
      }))

    // Calculate budget stats
    const budgetNum = Number(campaign.budget || 0)
    const spentNum = Number(campaign.spent || 0)
    const budgetUtilization = budgetNum > 0 ? (spentNum / budgetNum) * 100 : 0

    // Submission status counts
    const statusCounts = {
      total: campaign._count.clipSubmissions,
      approved: allSubmissions.filter(s => s.status === 'APPROVED' || s.status === 'PAID').length,
      pending: allSubmissions.filter(s => s.status === 'PENDING').length,
      rejected: allSubmissions.filter(s => s.status === 'REJECTED').length
    }

    // Unique creators count
    const uniqueCreatorIds = new Set(approvedSubmissions.map(s => s.creatorId))

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
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
        completionReason: campaign.completionReason,
        budgetReachedAt: null, // Requires migration to add column
        createdAt: campaign.createdAt
      },
      budget: {
        total: budgetNum,
        spent: spentNum,
        remaining: Math.max(0, budgetNum - spentNum),
        utilization: Math.min(budgetUtilization, 100),
        payoutRate: Number(campaign.payoutRate)
      },
      performance: {
        totalViews,
        totalViewsGained,
        totalEarnings,
        viewsAtBudgetReached: 0, // Requires migration to add column
        averageViewsPerClip: approvedSubmissions.length > 0 
          ? Math.round(totalViews / approvedSubmissions.length) 
          : 0
      },
      submissions: statusCounts,
      creators: {
        unique: uniqueCreatorIds.size,
        breakdown: creatorBreakdown,
        nonParticipating: nonParticipatingPages
      },
      platforms: platformBreakdown,
      topClips
    })
  } catch (error) {
    console.error("Error fetching client report data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

