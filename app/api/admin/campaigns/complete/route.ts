// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"

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

    // Get campaign with ALL submissions and clips for accurate stats
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        clipSubmissions: {
          include: {
            clips: {
              select: {
                id: true,
                earnings: true,
                views: true,
                view_tracking: {
                  orderBy: { date: 'desc' },
                  take: 1
                }
              }
            },
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                paypalEmail: true,
                walletAddress: true,
                bitcoinAddress: true,
                totalEarnings: true
              }
            }
          }
        }
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    if (campaign.status === "COMPLETED") {
      return NextResponse.json({ error: "Campaign is already completed" }, { status: 400 })
    }

    if (campaign.status === "SCHEDULED" || campaign.status === "DRAFT") {
      return NextResponse.json({ error: "Cannot complete a campaign that hasn't been active yet" }, { status: 400 })
    }

    // Calculate ACTUAL stats from all submissions
    const allSubmissions = campaign.clipSubmissions
    const approvedSubmissions = allSubmissions.filter(s => s.status === 'APPROVED')
    const pendingSubmissions = allSubmissions.filter(s => s.status === 'PENDING')
    
    // Calculate total earnings from all clips with earnings
    const totalEarnings = approvedSubmissions.reduce((sum, sub) => {
      return sum + Number(sub.clips?.earnings || 0)
    }, 0)

    // Calculate total views - use clip.views (MAX ever tracked) as source of truth
    const totalViews = approvedSubmissions.reduce((sum, sub) => {
      // clip.views stores MAX ever tracked, more reliable than viewTracking[0]
      return sum + Number(sub.clips?.views || sub.clips?.view_tracking?.[0]?.views || 0)
    }, 0)

    // Build user breakdown
    const userBreakdown = new Map<string, {
      userId: string
      name: string | null
      email: string | null
      earnings: number
      clipCount: number
      paypalEmail: string | null
      walletAddress: string | null
      bitcoinAddress: string | null
    }>()

    for (const sub of approvedSubmissions) {
      const userId = sub.userId
      const existing = userBreakdown.get(userId)
      const earnings = Number(sub.clips?.earnings || 0)
      
      if (existing) {
        existing.earnings += earnings
        existing.clipCount++
      } else {
        userBreakdown.set(userId, {
          userId,
          name: sub.users.name,
          email: sub.users.email,
          earnings,
          clipCount: 1,
          paypalEmail: sub.users.paypalEmail,
          walletAddress: sub.users.walletAddress,
          bitcoinAddress: sub.users.bitcoinAddress
        })
      }
    }

    const budget = Number(campaign.budget)
    const spent = Number(campaign.spent || 0)
    const progressPercentage = budget > 0 ? (spent / budget) * 100 : 0

    // Snapshot finalEarnings for all approved submissions BEFORE completing
    // This preserves the earnings amount at campaign end for historical record
    console.log(`📸 Snapshotting finalEarnings for ${approvedSubmissions.length} submissions in campaign ${campaignId}`)
    for (const sub of approvedSubmissions) {
      const earnings = Number(sub.clips?.earnings || 0)
      await prisma.clipSubmission.update({
        where: { id: sub.id },
        data: {
          finalEarnings: earnings
        }
      })
      console.log(`   Submission ${sub.id} (${sub.users.email}): $${earnings.toFixed(2)}`)
    }

    // Complete the campaign
    const completedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        completionReason: completionReason || `Campaign completed - budget ${progressPercentage.toFixed(1)}% utilized`
      },
      include: {
        _count: {
          select: {
            clipSubmissions: true
          }
        }
      }
    })

    console.log(`✅ Campaign ${campaignId} completed. ${approvedSubmissions.length} submissions finalized.`)

    // Send notifications to all users who had approved submissions
    for (const sub of approvedSubmissions) {
      await prisma.notification.create({
        data: {
          userId: sub.userId,
          type: 'CAMPAIGN_COMPLETED',
          title: 'Campaign Completed!',
          message: `"${campaign.title}" has been completed. Your earnings of $${Number(sub.clips?.earnings || 0).toFixed(2)} are now available for payout.`,
          data: {
            campaignId: campaign.id,
            campaignTitle: campaign.title,
            earnings: Number(sub.clips?.earnings || 0)
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      campaign: completedCampaign,
      stats: {
        totalSubmissions: allSubmissions.length,
        approvedSubmissions: approvedSubmissions.length,
        pendingSubmissions: pendingSubmissions.length,
        rejectedSubmissions: allSubmissions.filter(s => s.status === 'REJECTED').length,
        totalEarnings,
        totalViews,
        budget,
        spent,
        progressPercentage,
        uniqueClippers: userBreakdown.size
      },
      userBreakdown: Array.from(userBreakdown.values()).sort((a, b) => b.earnings - a.earnings)
    })

  } catch (error) {
    console.error("Error completing campaign:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
