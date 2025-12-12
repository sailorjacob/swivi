// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const processPayoutSchema = z.object({
  action: z.enum(['approve', 'reject', 'complete', 'revert']),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
  platformFeeRate: z.number().min(0).max(1).optional() // Fee rate as decimal (0.10 = 10%)
})

// Default platform fee rate - can be overridden per payout
const DEFAULT_PLATFORM_FEE_RATE = 0.10

// Process a payout request
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id }
    })

    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const payoutRequestId = params.id

    // Get payout request
    const payoutRequest = await prisma.payoutRequest.findUnique({
      where: { id: payoutRequestId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            totalEarnings: true
          }
        }
      }
    })

    if (!payoutRequest) {
      return NextResponse.json({ error: "Payout request not found" }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()
    const validatedData = processPayoutSchema.parse(body)

    let notificationMessage = ''
    let notificationType: any = 'PAYOUT_PROCESSED'

    // Validate state transitions to prevent invalid operations
    const currentStatus = payoutRequest.status
    const requestedAction = validatedData.action

    // State machine validation
    const validTransitions: Record<string, string[]> = {
      'PENDING': ['approve', 'reject'],
      'APPROVED': ['complete', 'reject', 'revert'],
      'PROCESSING': ['complete', 'reject', 'revert'],
      'COMPLETED': [], // Cannot change completed
      'REJECTED': [], // Cannot change rejected
      'CANCELLED': [] // Cannot change cancelled
    }

    if (!validTransitions[currentStatus]?.includes(requestedAction)) {
      console.error(`❌ INVALID STATE TRANSITION: Request ${payoutRequestId} in state ${currentStatus} cannot be ${requestedAction}d`)
      return NextResponse.json({
        error: `Cannot ${requestedAction} a payout request that is ${currentStatus}`,
        currentStatus,
        requestedAction
      }, { status: 400 })
    }

    // Handle different actions
    if (validatedData.action === 'reject') {
      // Reject the payout request
      await prisma.payoutRequest.update({
        where: { id: payoutRequestId },
        data: {
          status: 'REJECTED',
          processedAt: new Date(),
          processedBy: adminUser.id,
          notes: validatedData.notes || 'Rejected by admin'
        }
      })

      console.log(`📝 PAYOUT REJECTED: Admin ${adminUser.email} rejected request ${payoutRequestId} for $${Number(payoutRequest.amount).toFixed(2)}`)
      notificationMessage = `Your payout request for $${Number(payoutRequest.amount).toFixed(2)} was rejected. ${validatedData.notes || ''}`
      notificationType = 'PAYOUT_PROCESSED'

    } else if (validatedData.action === 'approve') {
      // Approve the payout request (mark as processing)
      await prisma.payoutRequest.update({
        where: { id: payoutRequestId },
        data: {
          status: 'APPROVED',
          processedBy: adminUser.id,
          notes: validatedData.notes || 'Approved by admin'
        }
      })

      console.log(`📝 PAYOUT APPROVED: Admin ${adminUser.email} approved request ${payoutRequestId} for $${Number(payoutRequest.amount).toFixed(2)}`)
      notificationMessage = `Your payout request for $${Number(payoutRequest.amount).toFixed(2)} has been approved and is being processed.`

    } else if (validatedData.action === 'revert') {
      // Revert from APPROVED/PROCESSING back to PENDING
      // Clear previous notes unless new notes provided, to start fresh
      await prisma.payoutRequest.update({
        where: { id: payoutRequestId },
        data: {
          status: 'PENDING',
          processedBy: null,
          processedAt: null,
          notes: validatedData.notes || null // Clear notes on revert unless new notes provided
        }
      })

      console.log(`📝 PAYOUT REVERTED: Admin ${adminUser.email} reverted request ${payoutRequestId} back to pending`)
      notificationMessage = `Your payout request for $${Number(payoutRequest.amount).toFixed(2)} has been moved back to pending status.`

    } else if (validatedData.action === 'complete') {
      // Complete the payout - money has been sent
      const payoutAmount = Number(payoutRequest.amount)
      
      // Calculate platform fee (use provided rate or default)
      const feeRate = validatedData.platformFeeRate ?? DEFAULT_PLATFORM_FEE_RATE
      const feeAmount = payoutAmount * feeRate
      const netAmount = payoutAmount - feeAmount

      // REQUIRE transaction ID for completed payouts (audit trail)
      if (!validatedData.transactionId || validatedData.transactionId.trim() === '') {
        return NextResponse.json({
          error: "Transaction ID is required to mark a payout as complete",
          hint: "Enter the PayPal/bank transaction ID to confirm payment was sent"
        }, { status: 400 })
      }

      // Use serializable transaction with row locking to prevent race conditions
      await prisma.$transaction(async (tx) => {
        // Re-fetch user with lock to get CURRENT balance (prevents race conditions)
        const freshUser = await tx.user.findUnique({
          where: { id: payoutRequest.userId },
          select: {
            id: true,
            email: true,
            totalEarnings: true
          }
        })

        if (!freshUser) {
          throw new Error("User not found during payout processing")
        }

        const currentBalance = Number(freshUser.totalEarnings)

        // Double-check balance at completion time (may have changed since approval)
        if (currentBalance < payoutAmount) {
          throw new Error(`INSUFFICIENT_BALANCE:${currentBalance}:${payoutAmount}`)
        }

        // Re-verify the request hasn't already been completed (idempotency check)
        const freshRequest = await tx.payoutRequest.findUnique({
          where: { id: payoutRequestId }
        })

        if (freshRequest?.status === 'COMPLETED') {
          throw new Error("ALREADY_COMPLETED")
        }

        // Update payout request status with fee tracking
        await tx.payoutRequest.update({
          where: { id: payoutRequestId },
          data: {
            status: 'COMPLETED',
            processedAt: new Date(),
            processedBy: adminUser.id,
            transactionId: validatedData.transactionId,
            notes: validatedData.notes || 'Payment sent',
            // Store fee information for record keeping
            platformFeeRate: feeRate,
            platformFeeAmount: feeAmount,
            netAmount: netAmount
          }
        })

        // Deduct from user's total earnings
        // CRITICAL: Use decrement to prevent overwriting concurrent updates
        const updatedUser = await tx.user.update({
          where: { id: payoutRequest.userId },
          data: {
            totalEarnings: {
              decrement: payoutAmount
            }
          },
          select: {
            totalEarnings: true
          }
        })

        // Verify balance didn't go negative (should never happen with proper validation)
        if (Number(updatedUser.totalEarnings) < 0) {
          throw new Error(`NEGATIVE_BALANCE:${updatedUser.totalEarnings}`)
        }

        // Map payment method to valid PayoutMethod enum
        const methodMap: Record<string, 'PAYPAL' | 'BANK_TRANSFER' | 'STRIPE' | 'ETHEREUM' | 'BITCOIN'> = {
          'PAYPAL': 'PAYPAL',
          'BANK_TRANSFER': 'BANK_TRANSFER',
          'STRIPE': 'STRIPE',
          'ETHEREUM': 'ETHEREUM',
          'BITCOIN': 'BITCOIN'
        }
        const payoutMethod = methodMap[payoutRequest.paymentMethod || 'PAYPAL'] || 'PAYPAL'

        // Create Payout record for accounting
        const payout = await tx.payout.create({
          data: {
            userId: payoutRequest.userId,
            amount: payoutAmount,
            currency: 'USD',
            method: payoutMethod,
            status: 'COMPLETED',
            paypalEmail: payoutRequest.paymentDetails,
            transactionId: validatedData.transactionId,
            netAmount: payoutAmount,
            processedAt: new Date()
          }
        })

        // Link payout to payout request
        await tx.payoutRequest.update({
          where: { id: payoutRequestId },
          data: {
            payoutId: payout.id
          }
        })

        // Audit log
        console.log(`✅ PAYOUT COMPLETED: Admin ${adminUser.email} completed payout ${payoutRequestId}`)
        console.log(`   User: ${freshUser.email}`)
        console.log(`   Gross Amount: $${payoutAmount.toFixed(2)}`)
        console.log(`   Platform Fee: ${(feeRate * 100).toFixed(0)}% ($${feeAmount.toFixed(2)})`)
        console.log(`   Net Sent: $${netAmount.toFixed(2)}`)
        console.log(`   Transaction ID: ${validatedData.transactionId}`)
        console.log(`   Balance Before: $${currentBalance.toFixed(2)}`)
        console.log(`   Balance After: $${Number(updatedUser.totalEarnings).toFixed(2)}`)
      }, {
        isolationLevel: 'Serializable',
        timeout: 15000 // 15 second timeout
      })

      notificationMessage = `Your payout of $${payoutAmount.toFixed(2)} has been sent! Transaction ID: ${validatedData.transactionId}`
    }

    // Send notification to user
    await prisma.notification.create({
      data: {
        userId: payoutRequest.userId,
        type: notificationType,
        title: 'Payout Update',
        message: notificationMessage,
        data: {
          payoutRequestId,
          action: validatedData.action,
          amount: Number(payoutRequest.amount)
        }
      }
    })

    const newStatus = validatedData.action === 'complete' ? 'COMPLETED' 
      : validatedData.action === 'reject' ? 'REJECTED' 
      : validatedData.action === 'revert' ? 'PENDING'
      : 'APPROVED'

    return NextResponse.json({
      success: true,
      message: `Payout request ${validatedData.action === 'revert' ? 'reverted to pending' : validatedData.action + 'd'} successfully`,
      payoutRequest: {
        id: payoutRequestId,
        status: newStatus
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Invalid data", 
        details: error.errors 
      }, { status: 400 })
    }

    // Handle custom errors from transaction
    if (error instanceof Error) {
      if (error.message.startsWith("INSUFFICIENT_BALANCE:")) {
        const [, balance, amount] = error.message.split(':')
        console.error(`❌ PAYOUT FAILED: Insufficient balance. User has $${balance}, requested $${amount}`)
        return NextResponse.json({
          error: "Insufficient user balance at time of completion",
          userBalance: parseFloat(balance),
          requestedAmount: parseFloat(amount),
          hint: "User's balance may have changed since request was made. Ask them to submit a new request."
        }, { status: 400 })
      }

      if (error.message === "ALREADY_COMPLETED") {
        return NextResponse.json({
          error: "This payout request has already been completed",
          hint: "Refresh the page to see the current status"
        }, { status: 400 })
      }

      if (error.message.startsWith("NEGATIVE_BALANCE:")) {
        const [, balance] = error.message.split(':')
        console.error(`🚨 CRITICAL: Payout would result in negative balance: $${balance}`)
        return NextResponse.json({
          error: "Critical error: Payout would result in negative balance",
          hint: "Please contact support immediately"
        }, { status: 500 })
      }
    }

    console.error("Error processing payout request:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

