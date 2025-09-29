import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createCampaignSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  creator: z.string().min(1, "Creator name is required"),
  budget: z.number().positive("Budget must be positive"),
  minPayout: z.number().positive("Minimum payout must be positive"),
  maxPayout: z.number().positive("Maximum payout must be positive"),
  deadline: z.string().transform((str) => new Date(str)),
  targetPlatforms: z.array(z.enum(["TIKTOK", "YOUTUBE", "INSTAGRAM", "TWITTER", "FACEBOOK"])),
  requirements: z.array(z.string()).optional().default([]),
  // featuredImage: z.string().optional(), // Commented out - not in DB
  // category: z.string().optional(), // Commented out - not in DB
  // difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(), // Commented out - not in DB
  // maxParticipants: z.number().positive().optional(), // Commented out - not in DB
  // tags: z.array(z.string()).optional().default([]), // Commented out - not in DB
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const platform = searchParams.get("platform")

    const where: any = {}

    if (status) {
      where.status = status.toUpperCase()
    } else {
      where.status = "ACTIVE" // Default to active campaigns
    }

    if (platform) {
      where.targetPlatforms = {
        has: platform.toUpperCase()
      }
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      },
      select: {
        id: true,
        title: true,
        description: true,
        creator: true,
        budget: true,
        spent: true,
        minPayout: true,
        maxPayout: true,
        deadline: true,
        // startDate: true, // Commented out - not in DB
        status: true,
        targetPlatforms: true,
        requirements: true,
        // featuredImage: true, // Commented out - not in DB
        // category: true, // Commented out - not in DB
        // difficulty: true, // Commented out - not in DB
        // maxParticipants: true, // Commented out - not in DB
        // tags: true, // Commented out - not in DB
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            submissions: true
          }
        }
      }
    })

    return NextResponse.json(campaigns)
  } catch (error) {
    console.error("Error fetching campaigns:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createCampaignSchema.parse(body)

    // Create the campaign
    const campaignData: any = {
      title: validatedData.title,
      description: validatedData.description,
      creator: validatedData.creator,
      budget: validatedData.budget,
      minPayout: validatedData.minPayout,
      maxPayout: validatedData.maxPayout,
      deadline: validatedData.deadline,
      targetPlatforms: validatedData.targetPlatforms,
      requirements: validatedData.requirements,
      // featuredImage: validatedData.featuredImage, // Commented out - not in DB
      // category: validatedData.category, // Commented out - not in DB
      // difficulty: validatedData.difficulty, // Commented out - not in DB
      // maxParticipants: validatedData.maxParticipants, // Commented out - not in DB
      // tags: validatedData.tags, // Commented out - not in DB
      status: "ACTIVE"
    }

    const campaign = await prisma.campaign.create({
      data: campaignData,
      include: {
        _count: {
          select: {
            submissions: true
          }
        }
      }
    })

    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 })
    }

    console.error("Error creating campaign:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
