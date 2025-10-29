import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerUserWithRole } from '@/lib/supabase-auth-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const { user, error: authError } = await getServerUserWithRole(['ADMIN'])
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')

    // Build where clause
    const whereClause: any = {
      campaigns: {
        status: {
          in: ['ACTIVE', 'COMPLETED']
        }
      }
    }

    if (campaignId) {
      whereClause.campaignId = campaignId
    }

    // Fetch all clips with their view tracking history
    const submissions = await prisma.clipSubmission.findMany({
      where: whereClause,
      select: {
        id: true,
        clipUrl: true,
        platform: true,
        status: true,
        createdAt: true,
        initialViews: true,
        campaigns: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        clips: {
          select: {
            id: true,
            earnings: true,
            view_tracking: {
              orderBy: {
                date: 'asc'
              },
              select: {
                id: true,
                views: true,
                date: true,
                scrapedAt: true
              }
            }
          }
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Process data for charting
    const chartData = submissions.map(submission => {
      const viewHistory = submission.clips?.view_tracking || []
      
      return {
        submissionId: submission.id,
        clipId: submission.clips?.id,
        clipUrl: submission.clipUrl,
        platform: submission.platform,
        status: submission.status,
        submittedAt: submission.createdAt,
        initialViews: Number(submission.initialViews || 0),
        currentViews: viewHistory.length > 0 ? Number(viewHistory[viewHistory.length - 1].views) : Number(submission.initialViews || 0),
        earnings: Number(submission.clips?.earnings || 0),
        campaign: {
          id: submission.campaigns.id,
          title: submission.campaigns.title,
          status: submission.campaigns.status
        },
        user: {
          id: submission.users.id,
          name: submission.users.name,
          email: submission.users.email
        },
        viewHistory: viewHistory.map(track => ({
          date: track.date,
          views: Number(track.views),
          scrapedAt: track.scrapedAt,
          // Determine if this scrape was successful (has views > 0 or is not first entry)
          success: Number(track.views) > 0 || viewHistory.indexOf(track) > 0
        }))
      }
    })

    // Group by campaign
    const campaignGroups = chartData.reduce((acc: any, item) => {
      const campaignId = item.campaign.id
      if (!acc[campaignId]) {
        acc[campaignId] = {
          campaign: item.campaign,
          clips: []
        }
      }
      acc[campaignId].clips.push(item)
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      campaigns: Object.values(campaignGroups),
      totalClips: chartData.length,
      totalCampaigns: Object.keys(campaignGroups).length
    })

  } catch (error) {
    console.error('Error fetching view history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch view history' },
      { status: 500 }
    )
  }
}

