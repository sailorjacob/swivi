// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { NotificationService } from "@/lib/notification-service"
import { RateLimitingService } from "@/lib/rate-limiting-service"
import { z } from "zod"

const createCampaignSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  creator: z.string().min(1, "Creator name is required"),
  budget: z.number().positive("Budget must be positive"),
  payoutRate: z.number().positive("Payout rate must be positive"),
  startDate: z.string().transform((str) => str ? new Date(str) : null).nullable(),
  targetPlatforms: z.array(z.enum(["TIKTOK", "YOUTUBE", "INSTAGRAM", "TWITTER"])),
  requirements: z.array(z.string()).optional().default([]),
  status: z.enum(["DRAFT", "SCHEDULED", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"]).optional().default("ACTIVE"),
  featuredImage: z.string().url().optional().nullable(),
  contentFolderUrl: z.string().url().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const platform = searchParams.get("platform")

    const where: any = {}
    
    // Filter out soft-deleted campaigns by default
    const includeDeleted = searchParams.get("includeDeleted") === "true"
    const includeTest = searchParams.get("includeTest") === "true"
    
    if (!includeDeleted) {
      where.deletedAt = null
    }
    
    if (!includeTest) {
      where.isTest = false
    }

    if (status) {
      if (status.toLowerCase() === "all") {
        // Don't filter by status - show all campaigns
      } else {
        where.status = status.toUpperCase()
      }
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
        startDate: true,
        status: true,
        hidden: true,
        isTest: true,
        deletedAt: true,
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

    // Convert Prisma Decimal types to numbers for proper client-side comparison
    // This fixes the "budget exhausted" false positive bug where Decimal objects
    // were being compared incorrectly as strings (lexicographic comparison)
    const campaignsWithNumbers = campaigns.map(campaign => ({
      ...campaign,
      budget: Number(campaign.budget),
      spent: Number(campaign.spent ?? 0),
      payoutRate: Number(campaign.payoutRate)
    }))

    return NextResponse.json(campaignsWithNumbers)
  } catch (error) {
    console.error("Error fetching campaigns:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitingService = RateLimitingService.getInstance()
    const rateLimitResult = await rateLimitingService.checkRateLimit(
      'campaign:create',
      request.ip || 'unknown'
    )

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      )
    }

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
    console.log("🔧 Campaign creation request body:", JSON.stringify(body, null, 2))
    const validatedData = createCampaignSchema.parse(body)
    console.log("✅ Validated data:", JSON.stringify(validatedData, null, 2))
    console.log("🔍 FeaturedImage in body:", body.featuredImage)
    console.log("🔍 FeaturedImage in validatedData:", validatedData.featuredImage)

    // Create the campaign
    const campaignData: any = {
      title: validatedData.title,
      description: validatedData.description,
      creator: validatedData.creator,
      budget: validatedData.budget,
      payoutRate: validatedData.payoutRate,
      targetPlatforms: validatedData.targetPlatforms,
      requirements: validatedData.requirements,
      status: validatedData.status || "ACTIVE"
    }

    // Add optional fields if provided
    if (validatedData.startDate) campaignData.startDate = validatedData.startDate
    if (body.featuredImage !== undefined) campaignData.featuredImage = validatedData.featuredImage
    if (validatedData.contentFolderUrl !== undefined) campaignData.contentFolderUrl = validatedData.contentFolderUrl

    console.log("📊 Creating campaign with data:", JSON.stringify(campaignData, null, 2))

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

    console.log("🎉 Created campaign:", JSON.stringify(campaign, null, 2))

    // Send notification to all clippers about new campaign
    if (campaign.status === "ACTIVE") {
      const notificationService = new NotificationService()
      await notificationService.notifyNewCampaignAvailable(
        campaign.id,
        campaign.title
      )
    }

    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 })
    }

    console.error("Error creating campaign:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
