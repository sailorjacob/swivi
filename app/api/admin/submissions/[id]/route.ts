// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { NotificationService } from "@/lib/notification-service"
import { z } from "zod"

const updateSubmissionSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "PAID"]),
  rejectionReason: z.string().optional(),
  payout: z.number().positive().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const currentUserData = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id }
    })

    if (!currentUserData || currentUserData.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const submission = await prisma.clipSubmission.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        clipUrl: true,
        platform: true,
        status: true,
        rejectionReason: true,
        payout: true,
        paidAt: true,
        createdAt: true,
        updatedAt: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        campaigns: {
          select: {
            id: true,
            title: true,
            creator: true,
            budget: true,
            spent: true
          }
        }
      }
    })

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    return NextResponse.json(submission)
  } catch (error) {
    console.error("Error fetching submission:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const currentUserData = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id }
    })

    if (!currentUserData || currentUserData.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateSubmissionSchema.parse(body)

    // Get current submission
    const submission = await prisma.clipSubmission.findUnique({
      where: { id: params.id },
      include: {
        users: true,
        campaigns: true
      }
    })

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    // Update submission
    const updatedSubmission = await prisma.clipSubmission.update({
      where: { id: params.id },
      data: {
        status: validatedData.status,
        rejectionReason: validatedData.rejectionReason,
        payout: validatedData.payout,
        paidAt: validatedData.status === "PAID" ? new Date() : null
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        campaigns: true
      }
    })

    // Send notifications based on status change
    const notificationService = new NotificationService()

    // If approved, send approval notification and create clip
    if (validatedData.status === "APPROVED" && submission.status !== "APPROVED") {
      // Create or link to clip for view tracking
      let clipId = submission.clipId
      if (!clipId) {
        const clip = await prisma.clip.create({
          data: {
            userId: submission.userId,
            url: submission.clipUrl,
            platform: submission.platform,
            status: 'ACTIVE'
          }
        })
        
        // Update submission with clip reference
        await prisma.clipSubmission.update({
          where: { id: params.id },
          data: { clipId: clip.id }
        })
        
        clipId = clip.id
      }

      await notificationService.notifySubmissionApproved(
        params.id,
        submission.userId,
        submission.campaigns.title
      )
    }

    // If rejected, send rejection notification
    if (validatedData.status === "REJECTED" && submission.status !== "REJECTED") {
      await notificationService.notifySubmissionRejected(
        params.id,
        submission.userId,
        submission.campaigns.title,
        validatedData.rejectionReason
      )
    }

    // If paid, send payout notification and update campaign
    if (validatedData.status === "PAID" && validatedData.payout) {
      await notificationService.notifyPayoutProcessed(
        submission.userId,
        validatedData.payout,
        `payout-${params.id}`
      )

      // Update campaign spent amount
      await prisma.campaign.update({
        where: { id: submission.campaignId },
        data: {
          spent: {
            increment: validatedData.payout
          }
        }
      })
    }

    return NextResponse.json(updatedSubmission)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 })
    }

    console.error("Error updating submission:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const currentUserData = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id }
    })

    if (!currentUserData || currentUserData.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Check if submission exists
    const submission = await prisma.clipSubmission.findUnique({
      where: { id: params.id }
    })

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    // Delete the submission
    await prisma.clipSubmission.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Submission deleted successfully" })
  } catch (error) {
    console.error("Error deleting submission:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
