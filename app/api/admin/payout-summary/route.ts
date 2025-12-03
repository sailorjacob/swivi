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

    // Get completed campaigns with their payout breakdown
    const completedCampaigns = await prisma.campaign.findMany({
      where: { status: 'COMPLETED' },
      select: {
        id: true,
        title: true,
        budget: true,
        spent: true,
        completedAt: true,
        completionReason: true,
        clipSubmissions: {
          where: { status: 'APPROVED' },
          select: {
            id: true,
            userId: true,
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                paypalEmail: true,
                walletAddress: true,
                bitcoinAddress: true
              }
            },
            clips: {
              select: {
                earnings: true
              }
            }
          }
        }
      },
      orderBy: { completedAt: 'desc' }
    })

    // Process completed campaigns to get user breakdowns
    const campaignSummaries = completedCampaigns.map(campaign => {
      const userEarnings = new Map<string, {
        userId: string
        name: string | null
        email: string | null
        paypalEmail: string | null
        walletAddress: string | null
        bitcoinAddress: string | null
        earnings: number
        clipCount: number
      }>()

      for (const submission of campaign.clipSubmissions) {
        const earnings = Number(submission.clips?.earnings || 0)
        const userId = submission.userId
        const existing = userEarnings.get(userId)
        
        if (existing) {
          existing.earnings += earnings
          existing.clipCount++
        } else {
          userEarnings.set(userId, {
            userId,
            name: submission.users.name,
            email: submission.users.email,
            paypalEmail: submission.users.paypalEmail,
            walletAddress: submission.users.walletAddress,
            bitcoinAddress: submission.users.bitcoinAddress,
            earnings,
            clipCount: 1
          })
        }
      }

      const totalEarnings = Array.from(userEarnings.values()).reduce((sum, u) => sum + u.earnings, 0)

      return {
        id: campaign.id,
        title: campaign.title,
        budget: Number(campaign.budget),
        spent: Number(campaign.spent),
        completedAt: campaign.completedAt,
        completionReason: campaign.completionReason,
        totalEarnings,
        clippersCount: userEarnings.size,
        clipsCount: campaign.clipSubmissions.length,
        userBreakdown: Array.from(userEarnings.values()).sort((a, b) => b.earnings - a.earnings)
      }
    })

    // Get all users with positive earnings (available balance)
    const usersWithEarnings = await prisma.user.findMany({
      where: {
        totalEarnings: { gt: 0 }
      },
      select: {
        id: true,
        name: true,
        email: true,
        paypalEmail: true,
        walletAddress: true,
        bitcoinAddress: true,
        totalEarnings: true,
        payoutRequests: {
          where: {
            status: { in: ['PENDING', 'APPROVED', 'PROCESSING'] }
          },
          select: {
            id: true,
            amount: true,
            status: true,
            requestedAt: true
          },
          orderBy: { requestedAt: 'desc' },
          take: 1
        },
        _count: {
          select: {
            clipSubmissions: {
              where: { status: 'APPROVED' }
            }
          }
        }
      },
      orderBy: { totalEarnings: 'desc' }
    })

    const usersWithBalances = usersWithEarnings.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      paypalEmail: u.paypalEmail,
      walletAddress: u.walletAddress,
      bitcoinAddress: u.bitcoinAddress,
      totalEarnings: Number(u.totalEarnings),
      approvedClips: u._count.clipSubmissions,
      hasPendingRequest: u.payoutRequests.length > 0,
      pendingRequest: u.payoutRequests[0] ? {
        id: u.payoutRequests[0].id,
        amount: Number(u.payoutRequests[0].amount),
        status: u.payoutRequests[0].status,
        requestedAt: u.payoutRequests[0].requestedAt
      } : null
    }))

    // Get pending payout requests count
    const pendingRequestsCount = await prisma.payoutRequest.count({
      where: { status: 'PENDING' }
    })

    // Get total pending amount from requests
    const pendingRequestsTotal = await prisma.payoutRequest.aggregate({
      where: { status: { in: ['PENDING', 'APPROVED', 'PROCESSING'] } },
      _sum: { amount: true }
    })

    // Get total user balances
    const totalUserBalances = await prisma.user.aggregate({
      where: { totalEarnings: { gt: 0 } },
      _sum: { totalEarnings: true }
    })

    return NextResponse.json({
      summary: {
        totalUserBalances: Number(totalUserBalances._sum.totalEarnings || 0),
        pendingRequestsCount,
        pendingRequestsTotal: Number(pendingRequestsTotal._sum.amount || 0),
        usersWithBalancesCount: usersWithBalances.length,
        completedCampaignsCount: completedCampaigns.length
      },
      usersWithBalances,
      completedCampaigns: campaignSummaries
    })

  } catch (error) {
    console.error("Error fetching payout summary:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

