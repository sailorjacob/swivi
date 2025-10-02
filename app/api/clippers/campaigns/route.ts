import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const platform = searchParams.get("platform")

    const where: any = {}

    if (status) {
      where.status = status.toUpperCase()
    } else {
      where.status = "ACTIVE" // Default to active campaigns
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
        deadline: true,
        startDate: true,
        status: true,
        targetPlatforms: true,
        requirements: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            submissions: true
          }
        }
      }
    })

    return NextResponse.json(campaigns)
  } catch (error) {
    console.error("Error fetching campaigns:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
