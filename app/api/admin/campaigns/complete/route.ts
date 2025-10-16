import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { EnhancedPaymentCalculator } from "@/lib/enhanced-payment-calculation"

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { campaignId, completionReason } = body

    if (!campaignId) {
      return NextResponse.json({ error: "campaignId is required" }, { status: 400 })
    }

    // Get campaign details
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        title: true,
        budget: true,
        spent: true,
        status: true,
        targetPlatforms: true
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    if (campaign.status === "COMPLETED") {
      return NextResponse.json({ error: "Campaign is already completed" }, { status: 400 })
    }

    // Calculate final earnings and budget status
    const { calculations, budgetStatus } = await EnhancedPaymentCalculator.calculateCampaignEarnings(campaignId)

    // Complete the campaign
    const completedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        completionReason: completionReason || `Campaign completed - budget ${budgetStatus.progressPercentage.toFixed(1)}% utilized`,
        spent: budgetStatus.spentBudget // Ensure final spent amount is recorded
      },
      include: {
        _count: {
          select: {
            clipSubmissions: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      campaign: completedCampaign,
      budgetStatus,
      earnings: {
        totalClips: calculations.length,
        totalEarnings: budgetStatus.totalEarnings,
        calculations: calculations.map(calc => ({
          clipId: calc.clipId,
          userName: calc.userName,
          viewsGained: calc.viewsGained,
          earnings: calc.earnings,
          paymentMethod: calc.paymentMethod,
          paymentAddress: calc.paymentAddress
        }))
      }
    })

  } catch (error) {
    console.error("Error completing campaign:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
