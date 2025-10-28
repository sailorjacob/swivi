// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const processPayoutSchema = z.object({
  action: z.enum(['approve', 'reject', 'complete']),
  transactionId: z.string().optional(),
  notes: z.string().optional()
})

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

      notificationMessage = `Your payout request for $${Number(payoutRequest.amount).toFixed(2)} has been approved and is being processed.`

    } else if (validatedData.action === 'complete') {
      // Complete the payout - money has been sent
      const payoutAmount = Number(payoutRequest.amount)

      // Verify user has sufficient balance
      if (Number(payoutRequest.users.totalEarnings) < payoutAmount) {
        return NextResponse.json({
          error: "Insufficient user balance",
          userBalance: Number(payoutRequest.users.totalEarnings),
          requestedAmount: payoutAmount
        }, { status: 400 })
      }

      // Create a transaction to:
      // 1. Update payout request status
      // 2. Deduct from user's totalEarnings
      // 3. Reset clip earnings for completed campaigns
      // 4. Create Payout record
      // 5. Send notification
      await prisma.$transaction(async (tx) => {
        // Update payout request
        await tx.payoutRequest.update({
          where: { id: payoutRequestId },
          data: {
            status: 'COMPLETED',
            processedAt: new Date(),
            processedBy: adminUser.id,
            transactionId: validatedData.transactionId,
            notes: validatedData.notes || 'Payment sent'
          }
        })

        // Deduct from user's total earnings
        await tx.user.update({
          where: { id: payoutRequest.userId },
          data: {
            totalEarnings: {
              decrement: payoutAmount
            }
          }
        })

        // Reset earnings for clips in completed campaigns
        await tx.$executeRaw`
          UPDATE clips
          SET earnings = 0
          WHERE id IN (
            SELECT clip_id FROM clip_submissions
            WHERE user_id = ${payoutRequest.userId}
            AND status = 'APPROVED'
            AND campaign_id IN (
              SELECT id FROM campaigns WHERE status = 'COMPLETED'
            )
          )
        `

        // Create Payout record for accounting
        const payout = await tx.payout.create({
          data: {
            userId: payoutRequest.userId,
            amount: payoutAmount,
            currency: 'USD',
            method: payoutRequest.paymentMethod || 'PAYPAL',
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
      })

      notificationMessage = `Your payout of $${payoutAmount.toFixed(2)} has been sent! ${validatedData.transactionId ? `Transaction ID: ${validatedData.transactionId}` : ''}`
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

    return NextResponse.json({
      success: true,
      message: `Payout request ${validatedData.action}d successfully`,
      payoutRequest: {
        id: payoutRequestId,
        status: validatedData.action === 'complete' ? 'COMPLETED' : validatedData.action === 'reject' ? 'REJECTED' : 'APPROVED'
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Invalid data", 
        details: error.errors 
      }, { status: 400 })
    }

    console.error("Error processing payout request:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

