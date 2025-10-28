// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const MINIMUM_PAYOUT = 20 // $20 minimum

const payoutRequestSchema = z.object({
  amount: z.number().min(MINIMUM_PAYOUT, `Minimum payout is $${MINIMUM_PAYOUT}`),
  paymentMethod: z.enum(['PAYPAL', 'BANK_TRANSFER', 'STRIPE']),
  paymentDetails: z.string().min(1, 'Payment details required (email, wallet address, etc.)')
})

// Create a payout request
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: {
        id: true,
        totalEarnings: true,
        paypalEmail: true,
        walletAddress: true,
        email: true,
        clipSubmissions: {
          where: {
            status: 'APPROVED',
            campaigns: {
              status: 'COMPLETED' // Only count earnings from completed campaigns
            }
          },
          include: {
            clips: {
              select: {
                earnings: true
              }
            }
          }
        }
      }
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Calculate available balance (only from completed campaigns)
    const availableBalance = dbUser.clipSubmissions.reduce((sum, submission) => {
      return sum + Number(submission.clips?.earnings || 0)
    }, 0)

    // Parse request body
    const body = await request.json()
    const validatedData = payoutRequestSchema.parse(body)

    // Check if requested amount exceeds available balance
    if (validatedData.amount > availableBalance) {
      return NextResponse.json({
        error: "Insufficient balance",
        availableBalance,
        requestedAmount: validatedData.amount
      }, { status: 400 })
    }

    // Check for pending payout requests
    const pendingRequest = await prisma.payoutRequest.findFirst({
      where: {
        userId: dbUser.id,
        status: {
          in: ['PENDING', 'APPROVED', 'PROCESSING']
        }
      }
    })

    if (pendingRequest) {
      return NextResponse.json({
        error: "You already have a pending payout request",
        existingRequest: {
          id: pendingRequest.id,
          amount: Number(pendingRequest.amount),
          status: pendingRequest.status,
          requestedAt: pendingRequest.requestedAt
        }
      }, { status: 400 })
    }

    // Create payout request
    const payoutRequest = await prisma.payoutRequest.create({
      data: {
        userId: dbUser.id,
        amount: validatedData.amount,
        paymentMethod: validatedData.paymentMethod,
        paymentDetails: validatedData.paymentDetails,
        status: 'PENDING'
      }
    })

    // Notify admins about new payout request
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true }
    })

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'PAYOUT_REQUESTED',
          title: 'New Payout Request',
          message: `A clipper has requested a payout of $${validatedData.amount.toFixed(2)}`,
          data: {
            payoutRequestId: payoutRequest.id,
            amount: validatedData.amount,
            requesterId: dbUser.id
          }
        }
      })
    }

    // Notify user that request was submitted
    await prisma.notification.create({
      data: {
        userId: dbUser.id,
        type: 'PAYOUT_REQUESTED',
        title: 'Payout Request Submitted',
        message: `Your payout request for $${validatedData.amount.toFixed(2)} has been submitted and is pending admin approval.`,
        data: {
          payoutRequestId: payoutRequest.id,
          amount: validatedData.amount
        }
      }
    })

    return NextResponse.json({
      success: true,
      payoutRequest: {
        id: payoutRequest.id,
        amount: Number(payoutRequest.amount),
        status: payoutRequest.status,
        paymentMethod: payoutRequest.paymentMethod,
        requestedAt: payoutRequest.requestedAt
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Invalid data", 
        details: error.errors 
      }, { status: 400 })
    }

    console.error("Error creating payout request:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Get user's payout requests
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { id: true }
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get all payout requests for this user
    const payoutRequests = await prisma.payoutRequest.findMany({
      where: { userId: dbUser.id },
      orderBy: { requestedAt: 'desc' }
    })

    return NextResponse.json({
      payoutRequests: payoutRequests.map(pr => ({
        id: pr.id,
        amount: Number(pr.amount),
        status: pr.status,
        paymentMethod: pr.paymentMethod,
        requestedAt: pr.requestedAt,
        processedAt: pr.processedAt,
        notes: pr.notes
      }))
    })

  } catch (error) {
    console.error("Error fetching payout requests:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

