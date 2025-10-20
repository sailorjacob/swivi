// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    const submissionId = params.id
    const body = await request.json()
    const { reason } = body

    // Get submission details
    const submission = await prisma.clipSubmission.findUnique({
      where: { id: submissionId },
      include: {
        users: { select: { id: true, name: true, email: true } },
        campaigns: { select: { title: true } }
      }
    })

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    // Update submission status to rejected
    await prisma.clipSubmission.update({
      where: { id: submissionId },
      data: {
        status: "REJECTED",
        rejectionReason: reason || "Rejected by admin"
      }
    })

    // Send notification to user about rejection
    await prisma.notification.create({
      data: {
        userId: submission.userId,
        type: "SUBMISSION_REJECTED",
        title: "Submission Rejected",
        message: `Your submission for "${submission.campaigns.title}" has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
        data: {
          submissionId,
          campaignTitle: submission.campaigns.title,
          reason
        }
      }
    })

    return NextResponse.json({
      message: "Submission rejected successfully",
      reason
    })

  } catch (error) {
    console.error("Error rejecting submission:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
