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
        payoutRate: true,
        budget: true,
        spent: true
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

    // Get recent submissions for activity feed
    const recentSubmissions = await prisma.clipSubmission.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        platform: true,
        initialViews: true,
        users: {
          select: { name: true, image: true }
        },
        clips: {
          select: {
            url: true,
            view_tracking: {
              orderBy: { date: 'desc' },
              take: 2,
              select: { views: true, scrapedAt: true }
            }
          }
        }
      }
    })

    // Get recent view tracking events for approved clips in this campaign
    const recentViewGrowth = await prisma.viewTracking.findMany({
      where: {
        clips: {
          clipSubmissions: {
            some: {
              campaignId,
              status: { in: ['APPROVED', 'PAID'] }
            }
          }
        }
      },
      orderBy: { scrapedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        views: true,
        scrapedAt: true,
        platform: true,
        clips: {
          select: {
            url: true,
            clipSubmissions: {
              where: { campaignId },
              take: 1,
              select: {
                initialViews: true,
                users: {
                  select: { name: true, image: true }
                }
              }
            }
          }
        }
      }
    })

    // Build activity feed - mix submissions and view growth events
    const submissionActivities = recentSubmissions.map(submission => {
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
        viewsGained: null as number | null
      }
    })

    // Add view growth activities
    const viewGrowthActivities = recentViewGrowth
      .filter(vt => vt.clips?.clipSubmissions?.[0])
      .map(vt => {
        const submission = vt.clips!.clipSubmissions[0]
        const initialViews = Number(submission.initialViews || 0)
        const currentViews = Number(vt.views || 0)
        const viewsGained = Math.max(0, currentViews - initialViews)
        
        return {
          id: `vt-${vt.id}`,
          type: 'VIEW_GROWTH' as const,
          timestamp: vt.scrapedAt,
          clipper: submission.users.name || 'Anonymous',
          clipperImage: submission.users.image,
          platform: vt.platform,
          clipUrl: vt.clips!.url,
          views: currentViews,
          viewsGained: viewsGained > 0 ? viewsGained : null
        }
      })
      .filter(a => a.viewsGained && a.viewsGained > 100) // Only show significant growth

    // Combine and sort by timestamp
    const activities = [...submissionActivities, ...viewGrowthActivities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 15)

    // Get total submissions count for this campaign (all statuses)
    const totalSubmissions = await prisma.clipSubmission.count({
      where: { campaignId }
    })

    // Calculate remaining budget for this campaign
    const campaignBudget = Number(campaign.budget || 0)
    const spent = Number(campaign.spent || 0)
    const remainingBudget = Math.max(0, campaignBudget - spent)

    // Get campaign totals
    const campaignTotals = {
      totalSubmissions, // All submissions for this campaign
      totalClippers: clipperStats.size, // Unique approved clippers
      totalClips: topClippers.length, // Approved clips
      totalViewsGained: Array.from(clipperStats.values()).reduce((sum, c) => sum + c.totalViewsGained, 0),
      totalEarnings: Array.from(clipperStats.values()).reduce((sum, c) => sum + c.totalEarnings, 0),
      remainingBudget // Budget remaining for this campaign
    }

    return NextResponse.json({
      campaign,
      topClippers: sortedClippers, // Keep as topClippers for this API
      topClips,
      recentActivity: activities,
      totals: campaignTotals
    })

  } catch (error) {
    console.error("Error fetching campaign activity:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

