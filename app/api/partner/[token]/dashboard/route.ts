export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Helper to extract handle from URL - matches admin logic
function extractHandleFromUrl(url: string, platform: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname

    if (platform === 'TIKTOK') {
      // TikTok: https://www.tiktok.com/@username/video/...
      const match = pathname.match(/\/@([^/]+)/)
      if (match) return match[1]
    } else if (platform === 'INSTAGRAM') {
      // Instagram: https://www.instagram.com/reel/...?igsh=... or /p/...
      // Instagram URLs don't always contain the username in the path
      // But sometimes: https://www.instagram.com/username/reel/...
      const parts = pathname.split('/').filter(Boolean)
      if (parts.length > 0 && !['p', 'reel', 'reels', 'tv', 'stories'].includes(parts[0])) {
        return parts[0]
      }
    } else if (platform === 'YOUTUBE') {
      // YouTube: https://www.youtube.com/@username/shorts/... or /shorts/...
      const match = pathname.match(/\/@([^/]+)/)
      if (match) return match[1]
      // YouTube shorts without handle: https://youtube.com/shorts/videoId
    } else if (platform === 'TWITTER') {
      // Twitter/X: https://twitter.com/username/status/... or https://x.com/username/...
      const parts = pathname.split('/').filter(Boolean)
      if (parts.length > 0 && parts[0] !== 'i') {
        return parts[0]
      }
    }
    return null
  } catch {
    return null
  }
}

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
        budgetReachedAt: true,
        budgetReachedViews: true,
        createdAt: true,
        clipSubmissions: {
          select: {
            id: true,
            clipUrl: true,
            platform: true,
            status: true,
            initialViews: true,
            finalEarnings: true,
            userId: true,
            createdAt: true,
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            },
            socialAccount: {
              select: {
                username: true,
                platform: true,
                verified: true
              }
            },
            clips: {
              select: {
                views: true,
                earnings: true
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
    const payoutRate = Number(campaign.payoutRate || 0)
    
    // Use budgetReachedViews as a snapshot of views when campaign budget was reached
    const budgetReachedViews = Number(campaign.budgetReachedViews || 0)

    // Track unique clippers and pages
    const uniqueClipperIds = new Set<string>()
    const uniqueApprovedClipperIds = new Set<string>()
    
    // Handle stats map for page tracking
    const handleStatsMap = new Map<string, {
      platform: string
      username: string
      isVerified: boolean
      clipCount: number
      approvedClipCount: number
      totalViews: number
      approvedViews: number
    }>()

    let totalViews = 0
    let totalSubmittedViews = 0 // All views from approved + pending
    let approvedViews = 0
    let pendingViews = 0
    let approvedCount = 0
    let pendingCount = 0
    let rejectedCount = 0
    let totalEarnings = 0
    
    const platformStats: Record<string, { 
      totalSubmissions: number
      approvedSubmissions: number
      totalViews: number
      budgetViews: number
      additionalViews: number
    }> = {}
    
    // Process all submissions
    const processedSubmissions = campaign.clipSubmissions.map(sub => {
      const initialViews = Number(sub.initialViews || 0)
      const currentViews = Number(sub.clips?.views || 0)
      const viewsGained = Math.max(0, currentViews - initialViews)
      const earnings = Number(sub.finalEarnings || sub.clips?.earnings || 0)
      const isApproved = sub.status === 'APPROVED' || sub.status === 'PAID'
      const isPending = sub.status === 'PENDING'
      const isRejected = sub.status === 'REJECTED'
      
      // Track unique clippers
      uniqueClipperIds.add(sub.userId)
      if (isApproved) {
        uniqueApprovedClipperIds.add(sub.userId)
        approvedCount++
        approvedViews += currentViews
        totalEarnings += earnings
      } else if (isPending) {
        pendingCount++
        pendingViews += currentViews
      } else if (isRejected) {
        rejectedCount++
      }
      
      // Total submitted views = approved + pending only
      if (!isRejected) {
        totalSubmittedViews += currentViews
      }
      
      // Track page/handle stats - matches admin logic
      const verifiedHandle = sub.socialAccount?.username
      const urlHandle = extractHandleFromUrl(sub.clipUrl, sub.platform)
      const handle = verifiedHandle || urlHandle || sub.users.email?.split('@')[0] || sub.users.id
      const isVerified = !!verifiedHandle  // A page is verified if they selected a verified social account
      const key = `${sub.platform}:${handle.toLowerCase()}`  // Normalize to lowercase
      
      const existing = handleStatsMap.get(key)
      if (existing) {
        existing.clipCount++
        if (!isRejected) {
          existing.totalViews += currentViews
        }
        if (isApproved) {
          existing.approvedClipCount++
          existing.approvedViews += currentViews
        }
      } else {
        handleStatsMap.set(key, {
          platform: sub.platform,
          username: handle,
          isVerified,
          clipCount: 1,
          approvedClipCount: isApproved ? 1 : 0,
          totalViews: !isRejected ? currentViews : 0,
          approvedViews: isApproved ? currentViews : 0
        })
      }
      
      // Platform stats
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
      if (isApproved) {
        platformStats[platform].approvedSubmissions++
        platformStats[platform].totalViews += currentViews
        totalViews += currentViews
      }

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
        earnings,
        submittedAt: sub.createdAt.toISOString()
      }
    })
    
    // Get page stats
    const allSubmittedPages = Array.from(handleStatsMap.values())
    const totalPagesSubmitted = allSubmittedPages.length
    const approvedPages = allSubmittedPages.filter(p => p.approvedClipCount > 0)
    const uniquePages = approvedPages.length
    const verifiedPages = approvedPages.filter(p => p.isVerified).length
    
    // Views at completion (views that generated earnings)
    const viewsAtCompletion = payoutRate > 0 ? Math.round(totalEarnings / payoutRate * 1000) : approvedViews
    const viewsAfterCompletion = Math.max(0, approvedViews - viewsAtCompletion)
    
    // Views during campaign vs after
    let viewsDuringCampaign = approvedViews
    let viewsAfterCampaign = 0
    
    if (budgetReachedViews > 0 && totalViews > budgetReachedViews) {
      viewsAfterCampaign = totalViews - budgetReachedViews
      viewsDuringCampaign = budgetReachedViews
      
      // Proportionally split views per platform
      const budgetRatio = budgetReachedViews / totalViews
      Object.keys(platformStats).forEach(platform => {
        const platformTotalViews = platformStats[platform].totalViews
        platformStats[platform].budgetViews = Math.round(platformTotalViews * budgetRatio)
        platformStats[platform].additionalViews = platformTotalViews - platformStats[platform].budgetViews
      })
    } else {
      Object.keys(platformStats).forEach(platform => {
        platformStats[platform].budgetViews = platformStats[platform].totalViews
        platformStats[platform].additionalViews = 0
      })
    }
    
    // Filter to approved submissions for display, sorted by views
    const approvedSubmissions = processedSubmissions
      .filter(sub => sub.status === 'APPROVED' || sub.status === 'PAID')
      .sort((a, b) => b.currentViews - a.currentViews)

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
        payoutRate,
        // Submission counts
        totalSubmissions: campaign.clipSubmissions.length,
        approvedSubmissions: approvedCount,
        pendingSubmissions: pendingCount,
        rejectedSubmissions: rejectedCount,
        // Clipper counts
        uniqueClippers: uniqueClipperIds.size,
        uniqueApprovedClippers: uniqueApprovedClipperIds.size,
        // Page counts
        totalPagesSubmitted,
        uniquePages,
        verifiedPages,
        // Views metrics
        totalViews: approvedViews,
        totalSubmittedViews,
        approvedViews,
        pendingViews,
        viewsAtCompletion,
        viewsAfterCompletion,
        viewsDuringCampaign,
        viewsAfterCampaign,
        // Earnings
        totalEarnings
      },
      platformStats,
      submissions: approvedSubmissions
    })
  } catch (error) {
    console.error("Error fetching partner dashboard:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
