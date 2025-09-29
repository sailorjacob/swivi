import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const campaignId = searchParams.get("campaignId")
    const platform = searchParams.get("platform")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    const where: any = {}

    if (status) {
      where.status = status.toUpperCase()
    }

    if (campaignId) {
      where.campaignId = campaignId
    }

    if (platform) {
      where.platform = platform.toUpperCase()
    }

    const submissions = await prisma.clipSubmission.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            totalViews: true,
            totalEarnings: true
          }
        },
        campaign: {
          select: {
            id: true,
            title: true,
            creator: true,
            budget: true,
            spent: true
          }
        },
        clip: {
          include: {
            viewTracking: {
              orderBy: {
                date: "desc"
              },
              take: 5
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit,
      skip: offset
    })

    const total = await prisma.clipSubmission.count({ where })

    return NextResponse.json({
      submissions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error("Error fetching submissions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
