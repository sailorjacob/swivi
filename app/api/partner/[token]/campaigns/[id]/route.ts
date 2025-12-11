export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string; id: string } }
) {
  try {
    const { token, id } = params

    if (!token || token.length < 10) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 })
    }

    // Find campaign with this token and id
    const campaign = await prisma.campaign.findFirst({
      where: { 
        clientAccessToken: token,
        id: id
      },
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
        requirements: true,
        featuredImage: true,
        contentFolderUrl: true,
        startDate: true,
        endDate: true,
        completedAt: true,
        createdAt: true,
        clipSubmissions: {
          select: {
            id: true,
            clipUrl: true,
            platform: true,
            status: true,
            initialViews: true,
            createdAt: true,
            userId: true,
            users: {
              select: {
                name: true,
                image: true
              }
            },
            socialAccount: {
              select: {
                username: true,
                platform: true
              }
            },
            clips: {
              select: {
                views: true
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

    // Calculate stats
    let totalViews = 0
    let viewsGained = 0
    let approvedCount = 0
    let pendingCount = 0
    let rejectedCount = 0
    const uniqueCreators = new Set<string>()

    const submissions = campaign.clipSubmissions.map(sub => {
      const initialViews = Number(sub.initialViews || 0)
      const currentViews = Number(sub.clips?.views || 0)
      const gained = Math.max(0, currentViews - initialViews)

      if (sub.status === 'APPROVED' || sub.status === 'PAID') {
        approvedCount++
        totalViews += currentViews
        viewsGained += gained
      } else if (sub.status === 'PENDING') {
        pendingCount++
      } else if (sub.status === 'REJECTED') {
        rejectedCount++
      }

      if (sub.userId) {
        uniqueCreators.add(sub.userId)
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
        viewsGained: gained,
        submittedAt: sub.createdAt.toISOString()
      }
    })

    // Sort by views (highest first) for approved, then by date for others
    submissions.sort((a, b) => {
      if ((a.status === 'APPROVED' || a.status === 'PAID') && (b.status === 'APPROVED' || b.status === 'PAID')) {
        return b.currentViews - a.currentViews
      }
      if (a.status === 'APPROVED' || a.status === 'PAID') return -1
      if (b.status === 'APPROVED' || b.status === 'PAID') return 1
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    })

    return NextResponse.json({
      id: campaign.id,
      title: campaign.title,
      description: campaign.description || '',
      creator: campaign.creator || 'Partner',
      status: campaign.status,
      budget: Number(campaign.budget || 0),
      spent: Number(campaign.spent || 0),
      payoutRate: Number(campaign.payoutRate || 0),
      targetPlatforms: campaign.targetPlatforms,
      requirements: campaign.requirements || [],
      featuredImage: campaign.featuredImage,
      contentFolderUrl: campaign.contentFolderUrl,
      startDate: campaign.startDate?.toISOString() || null,
      endDate: campaign.endDate?.toISOString() || null,
      completedAt: campaign.completedAt?.toISOString() || null,
      createdAt: campaign.createdAt.toISOString(),
      stats: {
        totalViews,
        viewsGained,
        totalSubmissions: campaign.clipSubmissions.length,
        approvedSubmissions: approvedCount,
        pendingSubmissions: pendingCount,
        rejectedSubmissions: rejectedCount,
        uniqueCreators: uniqueCreators.size
      },
      submissions
    })
  } catch (error) {
    console.error("Error fetching partner campaign detail:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
