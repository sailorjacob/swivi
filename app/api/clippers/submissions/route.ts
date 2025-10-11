import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createSubmissionSchema = z.object({
  campaignId: z.string(),
  clipUrl: z.string().url(),
  platform: z.enum(["TIKTOK", "YOUTUBE", "INSTAGRAM", "TWITTER", "FACEBOOK"]),
  mediaFileUrl: z.string().url().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the internal user ID from the database using supabaseAuthId
    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { id: true }
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const submissions = await prisma.clipSubmission.findMany({
      where: {
        userId: dbUser.id
      },
      orderBy: {
        createdAt: "desc"
      },
      select: {
        id: true,
        clipUrl: true,
        platform: true,
        status: true,
        payout: true,
        paidAt: true,
        createdAt: true,
        campaigns: {
          select: {
            id: true,
            title: true,
            creator: true,
            payoutRate: true
          }
        }
      }
    })

    return NextResponse.json(submissions)
  } catch (error) {
    console.error("Error fetching submissions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the internal user ID from the database using supabaseAuthId
    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { id: true }
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = createSubmissionSchema.parse(body)

    // Check if campaign exists and is active
    const campaign = await prisma.campaign.findUnique({
      where: { id: validatedData.campaignId }
    })

    if (!campaign || campaign.status !== "ACTIVE") {
      return NextResponse.json({ error: "Campaign not found or inactive" }, { status: 404 })
    }

    // Create the submission
    const submission = await prisma.clipSubmission.create({
      data: {
        userId: dbUser.id,
        campaignId: validatedData.campaignId,
        clipUrl: validatedData.clipUrl,
        platform: validatedData.platform,
        mediaFileUrl: validatedData.mediaFileUrl,
        status: "PENDING"
      },
      include: {
        campaigns: true
      }
    })

    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 })
    }
    
    console.error("Error creating submission:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
