// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"

// Get all payout requests (admin only)
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

    // Get filter from query params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')

    // Build where clause
    const where: any = {}
    if (status) {
      where.status = status
    }
    if (userId) {
      where.userId = userId
    }

    // Get payout requests with user details
    const payoutRequests = await prisma.payoutRequest.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            paypalEmail: true,
            walletAddress: true,
            totalEarnings: true
          }
        }
      },
      orderBy: { requestedAt: 'desc' }
    })

    return NextResponse.json({
      payoutRequests: payoutRequests.map(pr => ({
        id: pr.id,
        amount: Number(pr.amount),
        status: pr.status,
        paymentMethod: pr.paymentMethod,
        paymentDetails: pr.paymentDetails,
        requestedAt: pr.requestedAt,
        processedAt: pr.processedAt,
        processedBy: pr.processedBy,
        transactionId: pr.transactionId,
        notes: pr.notes,
        user: {
          id: pr.users.id,
          name: pr.users.name,
          email: pr.users.email,
          paypalEmail: pr.users.paypalEmail,
          walletAddress: pr.users.walletAddress,
          totalEarnings: Number(pr.users.totalEarnings)
        }
      }))
    })

  } catch (error) {
    console.error("Error fetching payout requests:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

