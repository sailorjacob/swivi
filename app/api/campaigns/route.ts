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
      include: {
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

export async function POST(request: NextRequest) {
  try {
    // This would be for creators/admins to create campaigns
    // For now, return method not allowed for clippers
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  } catch (error) {
    console.error("Error creating campaign:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
