// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { AnalyticsService } from "@/lib/analytics-service"

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const prisma = (await import("@/lib/prisma")).prisma
    const userData = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id }
    })

    if (!userData || userData.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "overview"
    const limit = parseInt(searchParams.get("limit") || "20")
    const days = parseInt(searchParams.get("days") || "30")

    const analyticsService = new AnalyticsService()

    let data: any

    switch (type) {
      case "overview":
        data = await analyticsService.getDashboardOverview()
        break

      case "platforms":
        data = await analyticsService.getPlatformAnalytics()
        break

      case "campaigns":
        data = await analyticsService.getCampaignAnalytics(limit)
        break

      case "users":
        data = await analyticsService.getTopUsersAnalytics(limit)
        break

      case "timeseries":
        data = await analyticsService.getTimeSeriesAnalytics(days)
        break

      case "funnel":
        data = await analyticsService.getConversionFunnel()
        break

      default:
        return NextResponse.json({ error: "Invalid analytics type" }, { status: 400 })
    }

    return NextResponse.json({
      type,
      data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("Error fetching enhanced analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
