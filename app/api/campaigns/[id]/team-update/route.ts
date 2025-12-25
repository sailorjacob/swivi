// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"

// Get team update for a campaign (accessible to any authenticated user)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        teamUpdate: true
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Return the team update (or null if none exists)
    return NextResponse.json({
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      teamUpdate: campaign.teamUpdate || null
    })
  } catch (error) {
    console.error("Error fetching team update:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

