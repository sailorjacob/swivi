import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const userData = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id }
    })

    if (!userData || userData.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const campaignId = searchParams.get("campaignId")
    const platform = searchParams.get("platform")
    const dateRange = searchParams.get("dateRange")
    const payoutStatus = searchParams.get("payoutStatus")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    const where: any = {}

    if (status && status !== "all") {
      where.status = status.toUpperCase()
    }

    if (campaignId) {
      where.campaignId = campaignId
    }

    if (platform && platform !== "all") {
      where.platform = platform.toUpperCase()
    }

    // Date range filtering
    if (dateRange && dateRange !== "all") {
      const now = new Date()
      let startDate: Date

      switch (dateRange) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        default:
          startDate = new Date(0)
      }

      where.createdAt = {
        gte: startDate
      }
    }

    // Payout status filtering
    if (payoutStatus && payoutStatus !== "all") {
      if (payoutStatus === "paid") {
        where.paidAt = { not: null }
      } else if (payoutStatus === "unpaid") {
        where.paidAt = null
      }
    }

    // First try a simple query to see if basic fields work
    const submissions = await prisma.clipSubmission.findMany({
      where,
      select: {
        id: true,
        clipUrl: true,
        platform: true,
        status: true,
        createdAt: true,
        userId: true,
        campaignId: true
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit,
      skip: offset
    })

    // Get user and campaign data separately to avoid relation issues
    const userIds = [...new Set(submissions.map(s => s.userId))]
    const campaignIds = [...new Set(submissions.map(s => s.campaignId))]

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true }
    })

    const campaigns = await prisma.campaign.findMany({
      where: { id: { in: campaignIds } },
      select: { id: true, title: true, creator: true }
    })

    // Combine the data
    const enrichedSubmissions = submissions.map(submission => ({
      ...submission,
      user: users.find(u => u.id === submission.userId),
      campaign: campaigns.find(c => c.id === submission.campaignId)
    }))

    const total = await prisma.clipSubmission.count({ where })

    return NextResponse.json({
      submissions: enrichedSubmissions,
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
