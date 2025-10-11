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

    // Check if user is admin
    console.log("🔍 Looking up user in database:", user.id)
    const userData = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id }
    })
    console.log("🔍 User data found:", { id: userData?.id, role: userData?.role })

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

    // Test if we can even access the table
    console.log("Testing database connection...")
    
    try {
      const testCount = await prisma.clipSubmission.count()
      console.log("Total submissions in database:", testCount)
    } catch (error) {
      console.error("Error counting submissions:", error)
      throw new Error("Database table access failed")
    }

    // Try the simplest possible query
    const submissions = await prisma.clipSubmission.findMany({
      select: {
        id: true,
        clipUrl: true,
        createdAt: true
      },
      take: 10
    })

    console.log("Found submissions:", submissions.length)

    const total = submissions.length

    return NextResponse.json({
      submissions: submissions,
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
