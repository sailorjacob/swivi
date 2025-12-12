// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const MINIMUM_PAYOUT = 20 // $20 minimum

const payoutRequestSchema = z.object({
  amount: z.number().min(MINIMUM_PAYOUT, `Minimum payout is $${MINIMUM_PAYOUT}`),
  paymentMethod: z.enum(['PAYPAL', 'BANK_TRANSFER', 'STRIPE', 'ETHEREUM', 'BITCOIN']),
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

    // Supported payout methods: PayPal, USDC (Ethereum), Bitcoin
    const supportedMethods = ['PAYPAL', 'ETHEREUM', 'BITCOIN']
    if (!supportedMethods.includes(validatedData.paymentMethod)) {
      return NextResponse.json({ 
        error: "Payment method not available",
        details: "Supported payout methods: PayPal, USDC (Ethereum), and Bitcoin."
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
          bitcoinAddress: true,
          clipSubmissions: {
            where: { status: 'APPROVED' },
            select: {
              clips: { select: { earnings: true } },
              campaigns: { select: { status: true, title: true } }
            }
          }
        }
      })

      if (!dbUser) {
        throw new Error("USER_NOT_FOUND")
      }

      // Calculate earnings from COMPLETED campaigns only (these are payable)
      const completedCampaignEarnings = dbUser.clipSubmissions
        .filter(s => s.campaigns.status === 'COMPLETED')
        .reduce((sum, s) => sum + Number(s.clips?.earnings || 0), 0)

      // Calculate earnings from ACTIVE campaigns (NOT payable yet)
      const activeCampaignEarnings = dbUser.clipSubmissions
        .filter(s => s.campaigns.status === 'ACTIVE')
        .reduce((sum, s) => sum + Number(s.clips?.earnings || 0), 0)

      // Get list of active campaigns this user has earnings in
      const activeCampaignTitles = Array.from(new Set(
        dbUser.clipSubmissions
          .filter(s => s.campaigns.status === 'ACTIVE' && Number(s.clips?.earnings || 0) > 0)
          .map(s => s.campaigns.title)
      ))

      // Use user.totalEarnings as the source of truth (not clip.earnings which can be stale)
      const availableBalance = Number(dbUser.totalEarnings || 0)

      // The payable amount is the lesser of user's balance and their completed campaign earnings
      const payableBalance = Math.min(availableBalance, completedCampaignEarnings)

      // BLOCK: If user has NO completed campaign earnings, they cannot request any payout
      if (completedCampaignEarnings <= 0) {
        throw new Error(`ACTIVE_CAMPAIGNS_ONLY:${activeCampaignEarnings}:${activeCampaignTitles.join(',')}`)
      }

      // ENFORCE: Full balance payout only - no partial payouts allowed
      // Allow small tolerance for floating point differences (within $0.01)
      const amountDifference = Math.abs(validatedData.amount - payableBalance)
      if (amountDifference > 0.01) {
        throw new Error(`FULL_BALANCE_REQUIRED:${payableBalance}:${validatedData.amount}`)
      }

      // Also validate against total available balance
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
      
      // Basic validation for Ethereum address (USDC) - just check it looks like an ETH address
      if (validatedData.paymentMethod === 'ETHEREUM') {
        const trimmed = validatedData.paymentDetails.trim()
        // Just check it starts with 0x and has reasonable length (not blocking valid addresses)
        if (!trimmed.startsWith('0x') || trimmed.length < 40) {
          throw new Error("INVALID_ETH_ADDRESS")
        }
      }
      
      // Basic validation for Bitcoin address - just check reasonable format
      if (validatedData.paymentMethod === 'BITCOIN') {
        const trimmed = validatedData.paymentDetails.trim()
        // Bitcoin addresses start with 1, 3, or bc1 and are 26-62 chars
        const looksLikeBTC = (trimmed.startsWith('1') || trimmed.startsWith('3') || trimmed.startsWith('bc1')) && 
                            trimmed.length >= 26 && trimmed.length <= 62
        if (!looksLikeBTC) {
          throw new Error("INVALID_BTC_ADDRESS")
        }
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
      
      if (error.message === "INVALID_ETH_ADDRESS") {
        return NextResponse.json({
          error: "Invalid Ethereum address",
          details: "Please enter a valid Ethereum wallet address starting with 0x"
        }, { status: 400 })
      }
      
      if (error.message === "INVALID_BTC_ADDRESS") {
        return NextResponse.json({
          error: "Invalid Bitcoin address",
          details: "Please enter a valid Bitcoin wallet address"
        }, { status: 400 })
      }

      // NEW: Handle active campaigns only error
      if (error.message.startsWith("ACTIVE_CAMPAIGNS_ONLY:")) {
        const [, activeCampaignEarnings, campaignTitles] = error.message.split(':')
        return NextResponse.json({
          error: "Payouts not available yet",
          code: "ACTIVE_CAMPAIGNS_ONLY",
          message: "Your earnings are from campaigns that are still active. Payouts are available once campaigns are completed.",
          activeCampaignEarnings: parseFloat(activeCampaignEarnings),
          activeCampaigns: campaignTitles ? campaignTitles.split(',').filter(Boolean) : [],
          hint: "Keep your videos live to maximize earnings. You'll be notified when campaigns complete and payouts become available."
        }, { status: 400 })
      }

      // Handle full balance required error (no partial payouts)
      if (error.message.startsWith("FULL_BALANCE_REQUIRED:")) {
        const [, payableBalance, requestedAmount] = error.message.split(':')
        return NextResponse.json({
          error: "Full balance payout required",
          code: "FULL_BALANCE_REQUIRED",
          message: `You must request your full payable balance of $${parseFloat(payableBalance).toFixed(2)}. Partial payouts are not allowed.`,
          payableBalance: parseFloat(payableBalance),
          requestedAmount: parseFloat(requestedAmount),
          hint: "Request your full balance amount."
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

