import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createCampaignSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  creator: z.string().min(1, "Creator name is required"),
  budget: z.number().positive("Budget must be positive"),
  payoutRate: z.number().positive("Payout rate must be positive"),
  deadline: z.string().transform((str) => new Date(str)),
  startDate: z.string().transform((str) => str ? new Date(str) : null).nullable(),
  targetPlatforms: z.array(z.enum(["TIKTOK", "YOUTUBE", "INSTAGRAM", "TWITTER"])),
  requirements: z.array(z.string()).optional().default([]),
  featuredImage: z.string().url().optional().nullable(),
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
        payoutRate: true,
        deadline: true,
        startDate: true,
        status: true,
        targetPlatforms: true,
        requirements: true,
        featuredImage: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            clipSubmissions: true
          }
        }
      }
    })

    return NextResponse.json(campaigns)
  } catch (error) {
    console.error("Error fetching campaigns:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const validatedData = createCampaignSchema.parse(body)

    // Create the campaign
    const campaignData: any = {
      title: validatedData.title,
      description: validatedData.description,
      creator: validatedData.creator,
      budget: validatedData.budget,
      payoutRate: validatedData.payoutRate,
      deadline: validatedData.deadline,
      targetPlatforms: validatedData.targetPlatforms,
      requirements: validatedData.requirements,
      status: "ACTIVE"
    }

    // Add optional fields if provided
    if (validatedData.startDate) campaignData.startDate = validatedData.startDate
    if (validatedData.featuredImage) campaignData.featuredImage = validatedData.featuredImage

    const campaign = await prisma.campaign.create({
      data: campaignData,
      include: {
        _count: {
          select: {
            clipSubmissions: true
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
