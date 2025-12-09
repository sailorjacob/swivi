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
  status: z.enum(["DRAFT", "SCHEDULED", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"]).optional(),
  hidden: z.boolean().optional(),
  isTest: z.boolean().optional(),
  restore: z.boolean().optional(), // Set to true to restore an archived campaign
  targetPlatforms: z.array(z.enum(["TIKTOK", "YOUTUBE", "INSTAGRAM", "TWITTER"])).optional(),
  requirements: z.array(z.string()).optional(),
  featuredImage: z.string().url().optional().nullable(),
  contentFolderUrl: z.string().url().optional().nullable(),
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
        hidden: true,
        targetPlatforms: true,
        requirements: true,
        featuredImage: true,
        contentFolderUrl: true,
        createdAt: true,
        updatedAt: true,
        completedAt: true,
        completionReason: true,
        _count: {
          select: {
            clipSubmissions: true
          }
        },
        clipSubmissions: {
          select: {
            id: true,
            clipUrl: true,
            platform: true,
            status: true,
            createdAt: true,
            initialViews: true,
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                paypalEmail: true,
                walletAddress: true,
                bitcoinAddress: true
              }
            },
            clips: {
              select: {
                id: true,
                earnings: true,
                views: true,
                status: true,
                view_tracking: {
                  orderBy: { scrapedAt: 'desc' },
                  select: {
                    views: true,
                    date: true,
                    scrapedAt: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Process submissions to include calculated fields and scrape tracking
    const processedSubmissions = campaign.clipSubmissions.map(sub => {
      const viewTracking = sub.clips?.view_tracking || []
      // IMPORTANT: Use clip.views as source of truth (MAX ever tracked)
      // viewTracking stores each scrape which may return lower values on failure
      const currentViews = Number(sub.clips?.views || viewTracking[0]?.views || 0)
      const initialViews = Number(sub.initialViews || 0)
      const viewsGained = Math.max(0, currentViews - initialViews)
      const earnings = Number(sub.clips?.earnings || 0)
      const scrapeCount = viewTracking.length

      return {
        id: sub.id,
        clipUrl: sub.clipUrl,
        platform: sub.platform,
        status: sub.status,
        clipStatus: sub.clips?.status || null,
        createdAt: sub.createdAt,
        initialViews,
        currentViews,
        viewsGained,
        earnings,
        scrapeCount,
        lastTracked: viewTracking[0]?.scrapedAt || null,
        user: {
          id: sub.users.id,
          name: sub.users.name,
          email: sub.users.email,
          paypalEmail: sub.users.paypalEmail,
          walletAddress: sub.users.walletAddress,
          bitcoinAddress: sub.users.bitcoinAddress
        }
      }
    })

    // Calculate stats
    const approvedSubmissions = processedSubmissions.filter(s => s.status === 'APPROVED')
    const totalEarnings = approvedSubmissions.reduce((sum, s) => sum + s.earnings, 0)
    const totalViews = approvedSubmissions.reduce((sum, s) => sum + s.currentViews, 0)
    const totalViewsGained = approvedSubmissions.reduce((sum, s) => sum + s.viewsGained, 0)

    // Convert Prisma Decimal types to numbers for proper client-side comparison
    return NextResponse.json({
      ...campaign,
      budget: Number(campaign.budget),
      spent: Number(campaign.spent ?? 0),
      payoutRate: Number(campaign.payoutRate),
      clipSubmissions: processedSubmissions,
      stats: {
        totalSubmissions: campaign._count.clipSubmissions,
        approvedCount: approvedSubmissions.length,
        pendingCount: processedSubmissions.filter(s => s.status === 'PENDING').length,
        rejectedCount: processedSubmissions.filter(s => s.status === 'REJECTED').length,
        totalEarnings,
        totalViews,
        totalViewsGained,
        budgetUtilization: Number(campaign.budget) > 0 
          ? (Number(campaign.spent ?? 0) / Number(campaign.budget)) * 100 
          : 0
      }
    })
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
    
    // Handle status transitions with proper safeguards
    if (validatedData.status !== undefined) {
      const currentStatus = existingCampaign.status
      const newStatus = validatedData.status
      
      // Define valid status transitions
      const validTransitions: Record<string, string[]> = {
        'DRAFT': ['SCHEDULED', 'ACTIVE', 'CANCELLED'],
        'SCHEDULED': ['DRAFT', 'ACTIVE', 'CANCELLED'],
        'ACTIVE': ['PAUSED', 'COMPLETED', 'CANCELLED'],
        'PAUSED': ['ACTIVE', 'COMPLETED', 'CANCELLED'],
        'COMPLETED': ['ACTIVE'], // Allow reactivating completed campaigns (e.g., budget increase)
        'CANCELLED': ['DRAFT'], // Allow moving cancelled back to draft for editing
      }
      
      // Check if transition is valid (or if status is unchanged)
      if (currentStatus !== newStatus) {
        const allowedTransitions = validTransitions[currentStatus || 'DRAFT'] || []
        if (!allowedTransitions.includes(newStatus)) {
          return NextResponse.json({ 
            error: `Invalid status transition: ${currentStatus} → ${newStatus}. Allowed: ${allowedTransitions.join(', ')}` 
          }, { status: 400 })
        }
      }
      
      updateData.status = newStatus
      
      // If status is being set to COMPLETED, set completedAt timestamp
      if (newStatus === "COMPLETED") {
        updateData.completedAt = new Date()
        updateData.completionReason = validatedData.completionReason || "Campaign completed by admin"
      }
      
      // If reactivating from COMPLETED, clear the completion fields
      if (currentStatus === "COMPLETED" && newStatus === "ACTIVE") {
        updateData.completedAt = null
        updateData.completionReason = null
        console.log("🔄 Reactivating completed campaign - clearing completion fields")
      }
      
      // If moving from CANCELLED back to DRAFT, reset for fresh start
      if (currentStatus === "CANCELLED" && newStatus === "DRAFT") {
        console.log("🔄 Moving cancelled campaign back to draft for editing")
      }
    }
    
    if (validatedData.targetPlatforms !== undefined) updateData.targetPlatforms = validatedData.targetPlatforms
    if (validatedData.requirements !== undefined) updateData.requirements = validatedData.requirements
    if (body.featuredImage !== undefined) updateData.featuredImage = validatedData.featuredImage
    if (validatedData.contentFolderUrl !== undefined) updateData.contentFolderUrl = validatedData.contentFolderUrl
    if (validatedData.hidden !== undefined) updateData.hidden = validatedData.hidden
    if (validatedData.isTest !== undefined) updateData.isTest = validatedData.isTest
    
    // Handle restore from archive
    if (validatedData.restore === true) {
      if (!existingCampaign.deletedAt) {
        return NextResponse.json({ error: "Campaign is not archived" }, { status: 400 })
      }
      updateData.deletedAt = null
      updateData.status = 'DRAFT' // Restore to draft status for review
      console.log("🔄 Restoring archived campaign to draft status")
    }

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

    // Check URL params for hard delete option
    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hard') === 'true'

    // Get campaign with submission stats
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { clipSubmissions: true }
        },
        clipSubmissions: {
          where: { status: 'APPROVED' },
          select: {
            clips: {
              select: { earnings: true }
            }
          }
        }
      }
    })

    if (!existingCampaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Calculate if campaign has real earnings
    const totalEarnings = existingCampaign.clipSubmissions.reduce((sum, sub) => {
      return sum + Number(sub.clips?.earnings || 0)
    }, 0)
    const hasEarnings = totalEarnings > 0
    const hasSubmissions = existingCampaign._count.clipSubmissions > 0

    // Determine delete behavior
    if (hardDelete) {
      // Hard delete requested - only allow for test campaigns or campaigns with no earnings
      if (hasEarnings && !existingCampaign.isTest) {
        return NextResponse.json({ 
          error: "Cannot permanently delete campaign with earnings",
          details: `This campaign has $${totalEarnings.toFixed(2)} in earnings. Use soft delete (archive) instead, or mark as test campaign first.`,
          totalEarnings,
          submissionCount: existingCampaign._count.clipSubmissions
        }, { status: 400 })
      }

      // Proceed with hard delete (cascades to submissions)
      await prisma.campaign.delete({
        where: { id: params.id }
      })

      console.log(`🗑️ Hard deleted campaign ${params.id} (test: ${existingCampaign.isTest}, earnings: $${totalEarnings})`)

      return NextResponse.json({ 
        message: "Campaign permanently deleted",
        deletedSubmissions: existingCampaign._count.clipSubmissions,
        wasTestCampaign: existingCampaign.isTest
      })
    }

    // Default: Soft delete (archive)
    await prisma.campaign.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date(),
        status: 'CANCELLED' // Also set status to cancelled
      }
    })

    console.log(`📦 Soft deleted (archived) campaign ${params.id}`)

    return NextResponse.json({ 
      message: "Campaign archived successfully",
      archived: true,
      submissionCount: existingCampaign._count.clipSubmissions,
      earningsPreserved: totalEarnings,
      hint: hasEarnings 
        ? "Campaign data preserved for historical records and user earnings" 
        : "Use ?hard=true to permanently delete if needed"
    })
  } catch (error) {
    console.error("Error deleting campaign:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
