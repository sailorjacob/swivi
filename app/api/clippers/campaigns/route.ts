// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const { user, error } = await getServerUserWithRole(request)

    if (!user || error) {
      console.log("❌ Campaigns API: No authenticated user or error:", {
        hasUser: !!user,
        userId: user?.id,
        error: error?.message,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ error: "No authenticated user" }, { status: 401 })
    }

    console.log("✅ Campaigns API: Valid session for user", user.id)

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const platform = searchParams.get("platform")

    const where: any = {
      // Never show hidden campaigns to clippers
      hidden: { not: true }
    }

    if (status) {
      if (status.toLowerCase() === 'all') {
        // Return all campaigns that clippers can see (ACTIVE + SCHEDULED + COMPLETED)
        where.status = { in: ['ACTIVE', 'SCHEDULED', 'COMPLETED'] }
      } else {
        where.status = status.toUpperCase()
      }
    } else {
      // Default: return ACTIVE, SCHEDULED, and COMPLETED campaigns for clippers to see
      // ACTIVE = can submit to, SCHEDULED = upcoming with countdown, COMPLETED = view history
      where.status = { in: ['ACTIVE', 'SCHEDULED', 'COMPLETED'] }
    }

    if (platform) {
      where.targetPlatforms = {
        has: platform.toUpperCase()
      }
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      },
      select: {
        id: true,
        title: true,
        description: true,
        creator: true,
        budget: true,
        spent: true,
        payoutRate: true,
        startDate: true,
        status: true,
        targetPlatforms: true,
        requirements: true,
        featuredImage: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            clipSubmissions: true
          }
        }
      }
    })

    console.log(`📊 Returning ${campaigns.length} campaigns for user ${user.id}`)
    return NextResponse.json(campaigns)
  } catch (error) {
    console.error("Error fetching campaigns:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
