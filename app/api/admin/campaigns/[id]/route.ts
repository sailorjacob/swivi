// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateCampaignSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().min(10, "Description must be at least 10 characters").optional(),
  creator: z.string().min(1, "Creator name is required").optional(),
  budget: z.number().positive("Budget must be positive").optional(),
  spent: z.number().min(0, "Spent amount cannot be negative").optional(),
  payoutRate: z.number().positive("Payout rate must be positive").optional(),
  startDate: z.string().transform((str) => str ? new Date(str) : null).nullable().optional(),
  endDate: z.string().transform((str) => str ? new Date(str) : null).nullable().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"]).optional(),
  targetPlatforms: z.array(z.enum(["TIKTOK", "YOUTUBE", "INSTAGRAM", "TWITTER"])).optional(),
  requirements: z.array(z.string()).optional(),
  featuredImage: z.string().url().optional().nullable(),
  completionReason: z.string().optional(),
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
    const userData = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id }
    })

    if (!userData || userData.role !== "ADMIN") {
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
        payoutRate: true,
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
    console.log("🔧 Update campaign request body:", JSON.stringify(body, null, 2))
    console.log("🔍 FeaturedImage in update body:", body.featuredImage)
    const validatedData = updateCampaignSchema.parse(body)
    console.log("✅ Validated update data:", JSON.stringify(validatedData, null, 2))
    console.log("🔍 FeaturedImage in validated data:", validatedData.featuredImage)

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
    if (validatedData.payoutRate !== undefined) updateData.payoutRate = validatedData.payoutRate
    if (validatedData.startDate !== undefined) updateData.startDate = validatedData.startDate
    if (validatedData.endDate !== undefined) updateData.endDate = validatedData.endDate
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status
      // If status is being set to COMPLETED, set completedAt timestamp
      if (validatedData.status === "COMPLETED") {
        updateData.completedAt = new Date()
        updateData.completionReason = validatedData.completionReason || "Campaign completed by admin"
      }
    }
    if (validatedData.targetPlatforms !== undefined) updateData.targetPlatforms = validatedData.targetPlatforms
    if (validatedData.requirements !== undefined) updateData.requirements = validatedData.requirements
    if (body.featuredImage !== undefined) updateData.featuredImage = validatedData.featuredImage

    console.log("📊 Final update data to apply:", JSON.stringify(updateData, null, 2))

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
            clipSubmissions: true
          }
        }
      }
    })

    console.log("🎉 Updated campaign:", JSON.stringify(campaign, null, 2))

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
