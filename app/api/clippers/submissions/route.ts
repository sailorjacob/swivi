import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
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
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const submissions = await prisma.clipSubmission.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: "desc"
      },
      include: {
        campaign: true,
        clip: true
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
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
        userId: session.user.id,
        campaignId: validatedData.campaignId,
        clipUrl: validatedData.clipUrl,
        platform: validatedData.platform,
        mediaFileUrl: validatedData.mediaFileUrl,
        status: "PENDING"
      },
      include: {
        campaign: true
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
