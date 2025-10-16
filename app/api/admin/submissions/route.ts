import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Admin submissions API called")

    const { user, error } = await getServerUserWithRole(request)
    console.log("🔍 Auth result:", { userId: user?.id, error })

    if (!user?.id || error) {
      console.log("❌ Authentication failed")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin - handle database errors gracefully
    console.log("🔍 Looking up user in database:", user.id)
    let userData
    try {
      userData = await prisma.user.findUnique({
        where: { supabaseAuthId: user.id }
      })
      console.log("🔍 User data found:", { id: userData?.id, role: userData?.role })
    } catch (dbError) {
      console.error("❌ Database error looking up user:", dbError.message)
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
    }

    if (!userData) {
      console.log("❌ User not found in database")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (userData.role !== "ADMIN") {
      console.log("❌ User is not admin, role:", userData.role)
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    console.log("✅ Admin access confirmed")

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")
    const status = searchParams.get("status")
    const platform = searchParams.get("platform")
    const dateRange = searchParams.get("dateRange")
    const payoutStatus = searchParams.get("payoutStatus")
    const requiresReview = searchParams.get("requiresReview")

    // Build where clause for filtering
    const where: any = {}

    if (status && status !== "all") {
      if (status === "flagged") {
        where.requiresReview = true
      } else {
        where.status = status
      }
    }

    if (platform && platform !== "all") {
      where.platform = platform
    }

    if (dateRange && dateRange !== "all") {
      const now = new Date()
      switch (dateRange) {
        case "today":
          where.createdAt = {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
          }
          break
        case "week":
          where.createdAt = {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          }
          break
        case "month":
          where.createdAt = {
            gte: new Date(now.getFullYear(), now.getMonth(), 1)
          }
          break
      }
    }

    if (payoutStatus && payoutStatus !== "all") {
      if (payoutStatus === "paid") {
        where.payout = { not: null }
      } else if (payoutStatus === "unpaid") {
        where.payout = null
      }
    }

    console.log("🔍 Fetching submissions with filters:", where)

    let submissions
    try {
      submissions = await prisma.clipSubmission.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      },
      select: {
        id: true,
        clipUrl: true,
        platform: true,
        status: true,
        payout: true,
        paidAt: true,
        createdAt: true,
        rejectionReason: true,
        requiresReview: true,
        reviewReason: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            totalViews: true,
            totalEarnings: true
          }
        },
        clips: {
          select: {
            id: true,
            title: true,
            views: true,
            earnings: true,
            view_tracking: {
              orderBy: { date: "desc" },
              take: 2
            }
          }
        },
        campaigns: {
          select: {
            id: true,
            title: true,
            creator: true,
            payoutRate: true
          }
        }
      },
      take: limit,
      skip: offset
    })

    console.log("✅ Found submissions:", submissions.length)
    } catch (dbError) {
      console.error("❌ Database error fetching submissions:", dbError.message)
      return NextResponse.json({
        submissions: [],
        pagination: {
          total: 0,
          limit,
          offset,
          hasMore: false
        }
      })
    }

    // Calculate pagination info - handle database errors
    let total
    try {
      total = await prisma.clipSubmission.count({ where })
      const hasMore = offset + limit < total

      return NextResponse.json({
        submissions: submissions,
        pagination: {
          total,
          limit,
          offset,
          hasMore
        }
      })
    } catch (dbError) {
      console.error("❌ Database error counting submissions:", dbError.message)
      return NextResponse.json({
        submissions: submissions,
        pagination: {
          total: 0,
          limit,
          offset,
          hasMore: false
        }
      })
    }
  } catch (error) {
    console.error("Error fetching submissions:", error)

    // Handle database connection errors gracefully
    if (error.message?.includes('database') || error.message?.includes('connection') || error.message?.includes("Can't reach database server")) {
      console.log('🔧 Database unavailable - returning empty results instead of 500 error')
      return NextResponse.json({
        submissions: [],
        pagination: {
          total: 0,
          limit,
          offset,
          hasMore: false
        }
      })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
