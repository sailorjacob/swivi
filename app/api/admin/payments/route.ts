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
    const { userIds, paymentMethod, notes } = body

    if (!notes) {
      return NextResponse.json({ error: "notes parameter is required for payment processing" }, { status: 400 })
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "userIds array is required" }, { status: 400 })
    }

    if (!paymentMethod || !['wallet', 'paypal', 'bank'].includes(paymentMethod)) {
      return NextResponse.json({ error: "Valid paymentMethod is required" }, { status: 400 })
    }

    // Mark payments as processed with proper tracking
    const result = await EnhancedPaymentCalculator.markPaymentsAsPaid(userIds, paymentMethod as 'wallet' | 'paypal' | 'bank', notes)

    if (result.success) {
      // In a real implementation, you would:
      // 1. Create payout records in the database
      // 2. Send notifications to users
      // 3. Integrate with payment processors (Stripe, crypto APIs, etc.)

      return NextResponse.json({
        success: true,
        message: `Successfully marked ${result.paidCount} payments as processed`,
        paidCount: result.paidCount,
        paymentMethod,
        notes
      })
    } else {
      return NextResponse.json({
        error: result.error || "Failed to process payments"
      }, { status: 500 })
    }

  } catch (error) {
    console.error("Error processing payments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
