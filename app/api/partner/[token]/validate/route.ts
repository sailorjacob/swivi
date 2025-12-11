export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token

    if (!token || token.length < 10) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 })
    }

    // Find any campaign with this client access token to validate partner access
    const campaign = await prisma.campaign.findFirst({
      where: { clientAccessToken: token },
      select: {
        id: true,
        creator: true,
        title: true,
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: "Invalid access token" }, { status: 404 })
    }

    // Count all campaigns for this partner (by creator name)
    const campaignCount = await prisma.campaign.count({
      where: { 
        clientAccessToken: token,
      }
    })

    return NextResponse.json({
      partnerName: campaign.creator || "Partner",
      campaignCount,
      valid: true
    })
  } catch (error) {
    console.error("Error validating partner token:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
