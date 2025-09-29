import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateCampaignSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().min(10, "Description must be at least 10 characters").optional(),
  creator: z.string().min(1, "Creator name is required").optional(),
  budget: z.number().positive("Budget must be positive").optional(),
  spent: z.number().min(0, "Spent amount cannot be negative").optional(),
  minPayout: z.number().positive("Minimum payout must be positive").optional(),
  maxPayout: z.number().positive("Maximum payout must be positive").optional(),
  deadline: z.string().transform((str) => new Date(str)).optional(),
  startDate: z.string().transform((str) => str ? new Date(str) : undefined).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"]).optional(),
  targetPlatforms: z.array(z.enum(["TIKTOK", "YOUTUBE", "INSTAGRAM", "TWITTER", "FACEBOOK"])).optional(),
  requirements: z.array(z.string()).optional(),
  featuredImage: z.string().optional(),
  // category: z.string().optional(), // Commented out - not in DB
  // difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(), // Commented out - not in DB
  // maxParticipants: z.number().positive().optional(), // Commented out - not in DB
  // tags: z.array(z.string()).optional(), // Commented out - not in DB
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
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
        submissions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            clip: true
          },
          orderBy: {
            createdAt: "desc"
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    return NextResponse.json(campaign)
  } catch (error) {
    console.error("Error fetching campaign:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const validatedData = updateCampaignSchema.parse(body)

    // Check if campaign exists
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id: params.id }
    })

    if (!existingCampaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Update the campaign - only include fields that exist in the database
    const updateData: any = {}
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.creator !== undefined) updateData.creator = validatedData.creator
    if (validatedData.budget !== undefined) updateData.budget = validatedData.budget
    if (validatedData.spent !== undefined) updateData.spent = validatedData.spent
    if (validatedData.minPayout !== undefined) updateData.minPayout = validatedData.minPayout
    if (validatedData.maxPayout !== undefined) updateData.maxPayout = validatedData.maxPayout
    if (validatedData.deadline !== undefined) updateData.deadline = validatedData.deadline
    // if (validatedData.startDate !== undefined) updateData.startDate = validatedData.startDate  // Commented out - not in DB
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.targetPlatforms !== undefined) updateData.targetPlatforms = validatedData.targetPlatforms
    if (validatedData.requirements !== undefined) updateData.requirements = validatedData.requirements
    // if (validatedData.featuredImage !== undefined) updateData.featuredImage = validatedData.featuredImage  // Commented out - not in DB

    // Note: The following fields are commented out because they don't exist in the current database
    // When the database is migrated to add these columns, uncomment them:
    // if (validatedData.category !== undefined) updateData.category = validatedData.category
    // if (validatedData.difficulty !== undefined) updateData.difficulty = validatedData.difficulty
    // if (validatedData.maxParticipants !== undefined) updateData.maxParticipants = validatedData.maxParticipants
    // if (validatedData.tags !== undefined) updateData.tags = validatedData.tags

    const campaign = await prisma.campaign.update({
      where: { id: params.id },
      data: updateData,
      include: {
        _count: {
          select: {
            submissions: true
          }
        }
      }
    })

    return NextResponse.json(campaign)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 })
    }

    console.error("Error updating campaign:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if campaign exists
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id: params.id }
    })

    if (!existingCampaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Delete the campaign (submissions will be cascade deleted)
    await prisma.campaign.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Campaign deleted successfully" })
  } catch (error) {
    console.error("Error deleting campaign:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
