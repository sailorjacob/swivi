// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const MINIMUM_PAYOUT = 20 // $20 minimum

const payoutRequestSchema = z.object({
  amount: z.number().min(MINIMUM_PAYOUT, `Minimum payout is $${MINIMUM_PAYOUT}`),
  paymentMethod: z.enum(['PAYPAL', 'BANK_TRANSFER', 'STRIPE', 'USDC', 'BITCOIN']),
  paymentDetails: z.string().min(1, 'Payment details required (email, wallet address, etc.)')
})

// Create a payout request
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse request body first to fail fast on invalid input
    const body = await request.json()
    const validatedData = payoutRequestSchema.parse(body)

    // Currently only PayPal is supported for payouts
    if (validatedData.paymentMethod !== 'PAYPAL') {
      return NextResponse.json({ 
        error: "Payment method not available",
        details: "Only PayPal payouts are currently supported. Bitcoin and other methods coming soon."
      }, { status: 400 })
    }

    // Use a transaction with row-level locking to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Get user with FOR UPDATE lock to prevent concurrent requests
      const dbUser = await tx.user.findUnique({
        where: { supabaseAuthId: user.id },
        select: {
          id: true,
          email: true,
          name: true,
          totalEarnings: true, // This is the source of truth for available balance
          paypalEmail: true,
          walletAddress: true,
          bitcoinAddress: true
        }
      })

      if (!dbUser) {
        throw new Error("USER_NOT_FOUND")
      }

      // Use user.totalEarnings as the source of truth (not clip.earnings which can be stale)
      const availableBalance = Number(dbUser.totalEarnings || 0)

      // Validate amount against available balance
      if (validatedData.amount > availableBalance) {
        throw new Error(`INSUFFICIENT_BALANCE:${availableBalance}:${validatedData.amount}`)
      }

      // Check for existing pending payout requests (within the same transaction)
      const pendingRequest = await tx.payoutRequest.findFirst({
        where: {
          userId: dbUser.id,
          status: {
            in: ['PENDING', 'APPROVED', 'PROCESSING']
          }
        }
      })

      if (pendingRequest) {
        throw new Error(`PENDING_EXISTS:${pendingRequest.id}:${pendingRequest.amount}:${pendingRequest.status}`)
      }

      // Validate payment details match the method
      if (validatedData.paymentMethod === 'PAYPAL' && !validatedData.paymentDetails.includes('@')) {
        throw new Error("INVALID_PAYPAL_EMAIL")
      }

      // Create payout request within transaction
      const payoutRequest = await tx.payoutRequest.create({
        data: {
          userId: dbUser.id,
          amount: validatedData.amount,
          paymentMethod: validatedData.paymentMethod,
          paymentDetails: validatedData.paymentDetails,
          status: 'PENDING'
        }
      })

      // Log the request for audit trail
      console.log(`📝 PAYOUT REQUEST CREATED: User ${dbUser.email} requested $${validatedData.amount} via ${validatedData.paymentMethod}. Request ID: ${payoutRequest.id}. Available balance: $${availableBalance}`)

      return { payoutRequest, dbUser, availableBalance }
    }, {
      // Set isolation level to prevent race conditions
      isolationLevel: 'Serializable',
      timeout: 10000 // 10 second timeout
    })

    const { payoutRequest, dbUser } = result

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

    // Handle custom errors from transaction
    if (error instanceof Error) {
      if (error.message === "USER_NOT_FOUND") {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }
      
      if (error.message.startsWith("INSUFFICIENT_BALANCE:")) {
        const [, availableBalance, requestedAmount] = error.message.split(':')
        return NextResponse.json({
          error: "Insufficient balance",
          availableBalance: parseFloat(availableBalance),
          requestedAmount: parseFloat(requestedAmount)
        }, { status: 400 })
      }
      
      if (error.message.startsWith("PENDING_EXISTS:")) {
        const [, id, amount, status] = error.message.split(':')
        return NextResponse.json({
          error: "You already have a pending payout request",
          existingRequest: { id, amount: parseFloat(amount), status }
        }, { status: 400 })
      }

      if (error.message === "INVALID_PAYPAL_EMAIL") {
        return NextResponse.json({
          error: "Invalid PayPal email address"
        }, { status: 400 })
      }
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

