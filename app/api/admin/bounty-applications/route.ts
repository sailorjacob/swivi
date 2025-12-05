// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

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
    const campaignId = searchParams.get("campaignId")
    const status = searchParams.get("status")
    const tier = searchParams.get("tier")

    const where: any = {}
    if (campaignId) where.campaignId = campaignId
    if (status) where.status = status
    if (tier) where.tier = tier

    const applications = await prisma.bountyApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        campaigns: {
          select: {
            id: true,
            title: true,
            creator: true
          }
        }
      }
    })

    // Get stats
    const stats = await prisma.bountyApplication.groupBy({
      by: ['status'],
      _count: { status: true }
    })

    const tierStats = await prisma.bountyApplication.groupBy({
      by: ['tier', 'status'],
      _count: { tier: true }
    })

    return NextResponse.json({
      applications,
      stats: {
        total: applications.length,
        byStatus: stats.reduce((acc, s) => {
          acc[s.status] = s._count.status
          return acc
        }, {} as Record<string, number>),
        byTier: tierStats
      }
    })

  } catch (error) {
    console.error("Error fetching bounty applications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

