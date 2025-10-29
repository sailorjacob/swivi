// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { ClipCreationService } from "@/lib/clip-creation-service"

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

    // Get submission details
    const submission = await prisma.clipSubmission.findUnique({
      where: { id: submissionId },
      include: {
        users: { select: { id: true, name: true, email: true } },
        campaigns: { select: { title: true, creator: true } }
      }
    })

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    if (submission.status !== "PENDING") {
      return NextResponse.json({ error: "Only pending submissions can be approved" }, { status: 400 })
    }

    // Use ClipCreationService to create the clip and start tracking
    const clipCreationService = new ClipCreationService()
    const result = await clipCreationService.createClipFromSubmission({
      submissionId,
      userId: submission.userId,
      campaignId: submission.campaignId,
      clipUrl: submission.clipUrl,
      platform: submission.platform
    })

    if (!result.success) {
      return NextResponse.json({
        error: "Failed to create clip",
        details: result.error
      }, { status: 500 })
    }

    return NextResponse.json({
      message: "Submission approved and clip created successfully",
      clipId: result.clipId,
      initialViews: typeof result.initialViews === 'bigint' ? result.initialViews.toString() : result.initialViews,
      metadata: result.metadata
    })

  } catch (error) {
    console.error("Error approving submission:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
