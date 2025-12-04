// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { EnhancedPaymentCalculator } from "@/lib/enhanced-payment-calculation"

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
    const status = searchParams.get("status") || "pending"
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    if (status === "pending") {
      // Get all pending payments
      const { users, totalPendingAmount } = await EnhancedPaymentCalculator.getAllPendingPayments()

      return NextResponse.json({
        payments: users,
        totalPendingAmount,
        status: "pending",
        pagination: {
          limit,
          offset,
          total: users.length,
          hasMore: false // For now, we return all pending payments
        }
      })

    } else if (status === "processed") {
      // Get processed payments from the Payout model
      const payouts = await prisma.payout.findMany({
        where: {
          status: 'COMPLETED'
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              paypalEmail: true,
              walletAddress: true,
              bitcoinAddress: true
            }
          }
        },
        orderBy: {
          processedAt: 'desc'
        },
        take: limit,
        skip: offset
      })

      const totalCount = await prisma.payout.count({
        where: { status: 'COMPLETED' }
      })

      const totalProcessedAmount = await prisma.payout.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true }
      })

      return NextResponse.json({
        payments: payouts.map(p => ({
          id: p.id,
          userId: p.userId,
          amount: Number(p.amount),
          method: p.method,
          status: p.status,
          transactionId: p.transactionId,
          processedAt: p.processedAt,
          createdAt: p.createdAt,
          user: {
            id: p.users.id,
            name: p.users.name,
            email: p.users.email,
            paypalEmail: p.users.paypalEmail,
            walletAddress: p.users.walletAddress,
            bitcoinAddress: p.users.bitcoinAddress
          }
        })),
        totalProcessedAmount: Number(totalProcessedAmount._sum.amount || 0),
        status: "processed",
        pagination: {
          limit,
          offset,
          total: totalCount,
          hasMore: offset + limit < totalCount
        }
      })

    } else {
      return NextResponse.json({
        error: "Invalid status. Supported: pending, processed"
      }, { status: 400 })
    }

  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DEPRECATED: This endpoint has been disabled to prevent double-payment issues.
// Use the payout request system instead:
// 1. Clippers request payouts via /api/clippers/payout-request
// 2. Admins process them via /api/admin/payout-requests/[id]/process
export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    error: "This endpoint is deprecated. Use the payout request system instead.",
    newFlow: {
      step1: "Clippers request payout at /api/clippers/payout-request",
      step2: "Admins process requests at /api/admin/payout-requests",
      step3: "Complete payout at /api/admin/payout-requests/[id]/process"
    }
  }, { status: 410 }) // 410 Gone
}
