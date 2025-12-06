// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = await getServerUserWithRole(request)
    
    if (!user || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const campaignId = params.id

    // Get campaign with basic info
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        title: true,
        status: true,
        payoutRate: true
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Get top clippers for this campaign (by views gained)
    const topClippers = await prisma.clipSubmission.findMany({
      where: {
        campaignId,
        status: { in: ['APPROVED', 'PAID'] }
      },
      select: {
        id: true,
        initialViews: true,
        userId: true,
        users: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        clips: {
          select: {
            id: true,
            url: true,
            platform: true,
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

    // Aggregate by user and calculate views gained
    const clipperStats = new Map<string, {
      userId: string
      name: string | null
      image: string | null
      totalViewsGained: number
      totalEarnings: number
      clipCount: number
      topClip: {
        url: string
        platform: string
        viewsGained: number
        earnings: number
      } | null
    }>()

    for (const submission of topClippers) {
      const userId = submission.userId
      const initialViews = Number(submission.initialViews || 0)
      const currentViews = submission.clips?.view_tracking?.[0]
        ? Number(submission.clips.view_tracking[0].views || 0)
        : initialViews
      const viewsGained = Math.max(0, currentViews - initialViews)
      const earnings = Number(submission.clips?.earnings || 0)

      const existing = clipperStats.get(userId)
      
      if (existing) {
        existing.totalViewsGained += viewsGained
        existing.totalEarnings += earnings
        existing.clipCount++
        // Update top clip if this one has more views
        if (!existing.topClip || viewsGained > existing.topClip.viewsGained) {
          existing.topClip = {
            url: submission.clips?.url || '',
            platform: submission.clips?.platform || '',
            viewsGained,
            earnings
          }
        }
      } else {
        clipperStats.set(userId, {
          userId,
          name: submission.users.name,
          image: submission.users.image,
          totalViewsGained: viewsGained,
          totalEarnings: earnings,
          clipCount: 1,
          topClip: submission.clips ? {
            url: submission.clips.url,
            platform: submission.clips.platform,
            viewsGained,
            earnings
          } : null
        })
      }
    }

    // Sort by total views gained and take top 10
    const sortedClippers = Array.from(clipperStats.values())
      .sort((a, b) => b.totalViewsGained - a.totalViewsGained)
      .slice(0, 10)

    // Get top clips for this campaign (by views gained)
    const topClips = topClippers
      .map(submission => {
        const initialViews = Number(submission.initialViews || 0)
        const currentViews = submission.clips?.view_tracking?.[0]
          ? Number(submission.clips.view_tracking[0].views || 0)
          : initialViews
        const viewsGained = Math.max(0, currentViews - initialViews)
        
        return {
          id: submission.clips?.id,
          url: submission.clips?.url || '',
          platform: submission.clips?.platform || '',
          viewsGained,
          currentViews,
          earnings: Number(submission.clips?.earnings || 0),
          clipper: {
            name: submission.users.name,
            image: submission.users.image
          }
        }
      })
      .filter(clip => clip.id)
      .sort((a, b) => b.viewsGained - a.viewsGained)
      .slice(0, 10)

    // Get recent activity for this campaign
    const recentSubmissions = await prisma.clipSubmission.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
      take: 15,
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        platform: true,
        users: {
          select: { name: true, image: true }
        },
        clips: {
          select: {
            url: true,
            view_tracking: {
              orderBy: { date: 'desc' },
              take: 1,
              select: { views: true, scrapedAt: true }
            }
          }
        }
      }
    })

    // Build activity feed
    const activities = recentSubmissions.map(submission => {
      const latestScrape = submission.clips?.view_tracking?.[0]
      
      return {
        id: submission.id,
        type: submission.status === 'PENDING' ? 'SUBMISSION' : 
              submission.status === 'APPROVED' ? 'APPROVED' : 
              submission.status === 'REJECTED' ? 'REJECTED' : 'SUBMISSION',
        timestamp: submission.updatedAt || submission.createdAt,
        clipper: submission.users.name || 'Anonymous',
        clipperImage: submission.users.image,
        platform: submission.platform,
        clipUrl: submission.clips?.url,
        views: latestScrape ? Number(latestScrape.views) : null,
        lastScraped: latestScrape?.scrapedAt
      }
    })

    // Get campaign totals
    const campaignTotals = {
      totalClippers: clipperStats.size,
      totalClips: topClippers.length,
      totalViewsGained: Array.from(clipperStats.values()).reduce((sum, c) => sum + c.totalViewsGained, 0),
      totalEarnings: Array.from(clipperStats.values()).reduce((sum, c) => sum + c.totalEarnings, 0)
    }

    return NextResponse.json({
      campaign,
      topClippers: sortedClippers,
      topClips,
      recentActivity: activities,
      totals: campaignTotals
    })

  } catch (error) {
    console.error("Error fetching campaign activity:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

