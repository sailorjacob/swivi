// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"

// Generate a new client access token
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = await getServerUserWithRole(request)
    
    if (!user || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const campaignId = params.id

    // Generate a unique token
    const token = randomBytes(24).toString('base64url')

    // Update campaign with new token
    const campaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: { clientAccessToken: token },
      select: {
        id: true,
        title: true,
        clientAccessToken: true
      }
    })

    return NextResponse.json({
      success: true,
      token: campaign.clientAccessToken,
      portalUrl: `/client/${campaign.clientAccessToken}`
    })
  } catch (error) {
    console.error("Error generating client token:", error)
    return NextResponse.json({ error: "Failed to generate token" }, { status: 500 })
  }
}

// Get current client access token
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = await getServerUserWithRole(request)
    
    if (!user || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const campaignId = params.id

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        clientAccessToken: true
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    return NextResponse.json({
      token: campaign.clientAccessToken,
      portalUrl: campaign.clientAccessToken ? `/client/${campaign.clientAccessToken}` : null
    })
  } catch (error) {
    console.error("Error fetching client token:", error)
    return NextResponse.json({ error: "Failed to fetch token" }, { status: 500 })
  }
}

// Delete/revoke client access token
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = await getServerUserWithRole(request)
    
    if (!user || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const campaignId = params.id

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { clientAccessToken: null }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error revoking client token:", error)
    return NextResponse.json({ error: "Failed to revoke token" }, { status: 500 })
  }
}

