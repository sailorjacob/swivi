// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole(request)
    
    if (!user || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get recent submissions across all active campaigns
    const recentSubmissions = await prisma.clipSubmission.findMany({
      where: {
        campaigns: {
          status: { in: ['ACTIVE', 'COMPLETED'] },
          isTest: false
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
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
        campaigns: {
          select: { id: true, title: true }
        },
        clips: {
          select: {
            url: true,
            earnings: true,
            view_tracking: {
              orderBy: { date: 'desc' },
              take: 1,
              select: { views: true, scrapedAt: true }
            }
          }
        }
      }
    })

    // Get recent view growth events
    const recentViewGrowth = await prisma.viewTracking.findMany({
      where: {
        clips: {
          clipSubmissions: {
            some: {
              status: { in: ['APPROVED', 'PAID'] },
              campaigns: {
                status: { in: ['ACTIVE', 'COMPLETED'] },
                isTest: false
              }
            }
          }
        }
      },
      orderBy: { scrapedAt: 'desc' },
      take: 8,
      select: {
        id: true,
        views: true,
        scrapedAt: true,
        platform: true,
        clips: {
          select: {
            url: true,
            clipSubmissions: {
              where: {
                status: { in: ['APPROVED', 'PAID'] }
              },
              take: 1,
              select: {
                initialViews: true,
                campaigns: {
                  select: { id: true, title: true }
                },
                users: {
                  select: { name: true, image: true }
                }
              }
            }
          }
        }
      }
    })

    // Get top clippers across all campaigns
    const topClippersData = await prisma.clipSubmission.findMany({
      where: {
        status: { in: ['APPROVED', 'PAID'] },
        campaigns: {
          status: { in: ['ACTIVE', 'COMPLETED'] },
          isTest: false
        }
      },
      select: {
        userId: true,
        initialViews: true,
        users: {
          select: { id: true, name: true, image: true }
        },
        clips: {
          select: {
            earnings: true,
            view_tracking: {
              orderBy: { date: 'desc' },
              take: 1,
              select: { views: true }
            }
          }
        }
      }
    })

    // Aggregate clipper stats
    const clipperStats = new Map<string, {
      userId: string
      name: string | null
      image: string | null
      totalViewsGained: number
      totalEarnings: number
      clipCount: number
    }>()

    for (const submission of topClippersData) {
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
      } else {
        clipperStats.set(userId, {
          userId,
          name: submission.users.name,
          image: submission.users.image,
          totalViewsGained: viewsGained,
          totalEarnings: earnings,
          clipCount: 1
        })
      }
    }

    // Sort and take top 5
    const topClippers = Array.from(clipperStats.values())
      .sort((a, b) => b.totalViewsGained - a.totalViewsGained)
      .slice(0, 5)

    // Build activity feed
    const submissionActivities = recentSubmissions.map(submission => ({
      id: submission.id,
      type: submission.status === 'PENDING' ? 'SUBMISSION' : 
            submission.status === 'APPROVED' ? 'APPROVED' : 
            submission.status === 'REJECTED' ? 'REJECTED' : 'SUBMISSION',
      timestamp: submission.updatedAt || submission.createdAt,
      creator: submission.users.name || 'Anonymous',
      creatorImage: submission.users.image,
      platform: submission.platform,
      campaign: submission.campaigns?.title,
      campaignId: submission.campaigns?.id,
      viewsGained: null as number | null
    }))

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
          creator: submission.users.name || 'Anonymous',
          creatorImage: submission.users.image,
          platform: vt.platform,
          campaign: submission.campaigns?.title,
          campaignId: submission.campaigns?.id,
          viewsGained: viewsGained > 0 ? viewsGained : null
        }
      })
      .filter(a => a.viewsGained && a.viewsGained > 100)

    // Combine and sort
    const activities = [...submissionActivities, ...viewGrowthActivities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)

    // Get total submissions count
    const totalSubmissions = await prisma.clipSubmission.count({
      where: {
        campaigns: {
          status: { in: ['ACTIVE', 'COMPLETED'] },
          isTest: false
        }
      }
    })

    // Get active campaigns to calculate remaining budget
    const activeCampaigns = await prisma.campaign.findMany({
      where: {
        status: 'ACTIVE',
        isTest: false
      },
      select: {
        budget: true,
        spent: true
      }
    })

    // Calculate total remaining budget across all active campaigns
    const totalRemainingBudget = activeCampaigns.reduce((sum, campaign) => {
      const budget = Number(campaign.budget || 0)
      const spent = Number(campaign.spent || 0)
      return sum + Math.max(0, budget - spent)
    }, 0)

    // Platform totals
    const totals = {
      totalSubmissions, // Total clip submissions
      totalCreators: clipperStats.size, // Approved clippers with views
      totalViewsGained: Array.from(clipperStats.values()).reduce((sum, c) => sum + c.totalViewsGained, 0),
      totalEarnings: Array.from(clipperStats.values()).reduce((sum, c) => sum + c.totalEarnings, 0),
      totalRemainingBudget // Total budget remaining across active campaigns
    }

    return NextResponse.json({
      topCreators: topClippers,
      recentActivity: activities,
      totals
    })

  } catch (error) {
    console.error("Error fetching activity:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

