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

    // Find campaigns with this token
    const campaigns = await prisma.campaign.findMany({
      where: { clientAccessToken: token },
      select: {
        id: true,
        title: true,
        creator: true,
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
                name: true,
                image: true
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

    if (campaigns.length === 0) {
      return NextResponse.json({ error: "No campaigns found" }, { status: 404 })
    }

    const partnerName = campaigns[0].creator || "Partner"

    // Flatten all submissions
    const allSubmissions = campaigns.flatMap(campaign =>
      campaign.clipSubmissions.map(sub => {
        const initialViews = Number(sub.initialViews || 0)
        const currentViews = Number(sub.clips?.views || 0)
        const viewsGained = Math.max(0, currentViews - initialViews)

        return {
          id: sub.id,
          clipUrl: sub.clipUrl,
          platform: sub.platform,
          status: sub.status,
          creatorName: sub.users.name || 'Creator',
          creatorImage: sub.users.image,
          campaignTitle: campaign.title,
          initialViews,
          currentViews,
          viewsGained,
          submittedAt: sub.createdAt.toISOString()
        }
      })
    )

    // Sort by date (newest first)
    allSubmissions.sort((a, b) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    )

    // Calculate stats
    const stats = {
      total: allSubmissions.length,
      approved: allSubmissions.filter(s => s.status === 'APPROVED' || s.status === 'PAID').length,
      pending: allSubmissions.filter(s => s.status === 'PENDING').length,
      rejected: allSubmissions.filter(s => s.status === 'REJECTED').length
    }

    return NextResponse.json({
      partnerName,
      submissions: allSubmissions,
      stats
    })
  } catch (error) {
    console.error("Error fetching partner submissions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
