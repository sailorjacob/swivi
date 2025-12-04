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
        initialViews: true,
        finalEarnings: true,
        clipId: true,
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
        },
        clips: {
          select: {
            id: true,
            earnings: true,
            view_tracking: {
              orderBy: {
                date: 'desc'
              },
              take: 1,
              select: {
                views: true,
                date: true
              }
            }
          }
        }
      }
    })

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    // Get latest view count and calculate change
    const latestViews = submission.clips?.view_tracking[0]?.views || BigInt(0)
    const initialViews = submission.initialViews || BigInt(0)
    const viewChange = latestViews - initialViews

    // Convert BigInt values to strings for JSON serialization
    const submissionResponse = {
      ...submission,
      initialViews: submission.initialViews?.toString() || "0",
      finalEarnings: submission.finalEarnings?.toString() || "0",
      payout: submission.payout?.toString() || null,
      currentViews: latestViews.toString(),
      viewChange: viewChange.toString(),
      earnings: submission.clips?.earnings?.toString() || "0",
      clips: submission.clips ? {
        ...submission.clips,
        earnings: submission.clips.earnings?.toString() || "0",
        view_tracking: submission.clips.view_tracking.map(vt => ({
          ...vt,
          views: vt.views.toString()
        }))
      } : null
    }

    return NextResponse.json(submissionResponse)
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

    // Send notifications based on status change (non-blocking - don't fail if notification fails)
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

      try {
        await notificationService.notifySubmissionApproved(
          params.id,
          submission.userId,
          submission.campaigns.title
        )
      } catch (notifyError) {
        console.error("Failed to send approval notification:", notifyError)
        // Don't fail the whole operation if notification fails
      }
    }

    // If rejected, send rejection notification
    if (validatedData.status === "REJECTED" && submission.status !== "REJECTED") {
      try {
        await notificationService.notifySubmissionRejected(
          params.id,
          submission.userId,
          submission.campaigns.title,
          validatedData.rejectionReason
        )
      } catch (notifyError) {
        console.error("Failed to send rejection notification:", notifyError)
        // Don't fail the whole operation if notification fails
      }
    }

    // If paid, send payout notification and update campaign
    if (validatedData.status === "PAID" && validatedData.payout) {
      try {
        await notificationService.notifyPayoutProcessed(
          submission.userId,
          validatedData.payout,
          `payout-${params.id}`
        )
      } catch (notifyError) {
        console.error("Failed to send payout notification:", notifyError)
        // Don't fail the whole operation if notification fails
      }

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

    // Convert BigInt for response
    const responseData = {
      ...updatedSubmission,
      initialViews: updatedSubmission.initialViews?.toString() || "0",
      finalEarnings: updatedSubmission.finalEarnings?.toString() || "0",
      payout: updatedSubmission.payout?.toString() || null,
    }

    return NextResponse.json(responseData)
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

    // Get current user
    const currentUserData = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id }
    })

    if (!currentUserData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if submission exists and get its details
    const submission = await prisma.clipSubmission.findUnique({
      where: { id: params.id },
      include: {
        clips: {
          select: {
            earnings: true
          }
        }
      }
    })

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    // Check permissions: Admin can delete any, clipper can only delete their own
    const isAdmin = currentUserData.role === "ADMIN"
    const isOwner = submission.userId === currentUserData.id

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "You can only delete your own submissions" }, { status: 403 })
    }

    // Clippers cannot delete if there are earnings
    if (!isAdmin && submission.clips?.earnings && Number(submission.clips.earnings) > 0) {
      return NextResponse.json({ 
        error: "Cannot delete submission with earnings",
        details: "This submission has already earned money and cannot be deleted."
      }, { status: 400 })
    }

    // Delete the submission (and related clip if no other submissions reference it)
    await prisma.clipSubmission.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Submission deleted successfully" })
  } catch (error) {
    console.error("Error deleting submission:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
