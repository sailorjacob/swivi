import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerUserWithRole } from '@/lib/supabase-auth-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await getServerUserWithRole(request)
    
    if (!authResult || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { user } = authResult
    
    // Check if user is actually an admin
    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { role: true }
    })
    
    if (!dbUser || dbUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')

    // Build where clause - show all submissions with clips/tracking
    const whereClause: any = {}

    if (campaignId) {
      whereClause.campaignId = campaignId
    }

    // Fetch ALL submissions with their view tracking history
    // This includes PENDING submissions so admins can see clip performance before approval
    const submissions = await prisma.clipSubmission.findMany({
      where: whereClause,
      select: {
        id: true,
        clipUrl: true,
        platform: true,
        status: true,
        createdAt: true,
        initialViews: true,
        processingStatus: true,
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
            status: true, // Clip status (PENDING or ACTIVE)
            views: true,
            view_tracking: {
              orderBy: {
                scrapedAt: 'asc' // Order by actual scrape time for complete history
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

    // Process data for charting - include ALL submissions for admin visibility
    const chartData = submissions.map(submission => {
      const viewHistory = submission.clips?.view_tracking || []
      
      // Get current views from clip if available, otherwise from last tracking record or initial
      const currentViews = submission.clips?.views 
        ? Number(submission.clips.views)
        : viewHistory.length > 0 
          ? Number(viewHistory[viewHistory.length - 1].views) 
          : Number(submission.initialViews || 0)
      
      return {
        submissionId: submission.id,
        clipId: submission.clips?.id,
        clipUrl: submission.clipUrl,
        platform: submission.platform,
        status: submission.status, // PENDING, APPROVED, REJECTED, etc.
        clipStatus: submission.clips?.status || null, // PENDING, ACTIVE (clip level)
        processingStatus: submission.processingStatus,
        submittedAt: submission.createdAt,
        initialViews: Number(submission.initialViews || 0),
        currentViews,
        // Only show earnings for approved clips
        earnings: submission.status === 'APPROVED' ? Number(submission.clips?.earnings || 0) : 0,
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
        })),
        // Add scrape count for quick reference
        scrapeCount: viewHistory.length
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

