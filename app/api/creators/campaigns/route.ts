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

    // Only show ACTIVE, SCHEDULED, and COMPLETED campaigns to clippers
    // DRAFT campaigns are NEVER shown - they're hidden/work-in-progress
    // Admin must explicitly set status to COMPLETED for it to show in completed tab
    if (status) {
      if (status.toLowerCase() === 'all') {
        where.status = { in: ['ACTIVE', 'SCHEDULED', 'COMPLETED'] }
      } else {
        where.status = status.toUpperCase()
      }
    } else {
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

    // Convert Prisma Decimal types to numbers for proper client-side comparison
    // This fixes the "budget exhausted" false positive bug where Decimal objects
    // were being compared incorrectly
    const campaignsWithNumbers = campaigns.map(campaign => ({
      ...campaign,
      budget: Number(campaign.budget),
      spent: Number(campaign.spent ?? 0),
      payoutRate: Number(campaign.payoutRate)
    }))

    console.log(`📊 Returning ${campaigns.length} campaigns for user ${user.id}`)
    return NextResponse.json(campaignsWithNumbers)
  } catch (error) {
    console.error("Error fetching campaigns:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
