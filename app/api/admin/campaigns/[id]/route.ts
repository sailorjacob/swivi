// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Helper to extract handle from social media URL
function extractHandleFromUrl(url: string, platform: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    
    if (platform === 'TIKTOK') {
      // TikTok: https://www.tiktok.com/@username/video/...
      const match = pathname.match(/\/@([^/]+)/)
      if (match) return match[1]
    } else if (platform === 'INSTAGRAM') {
      // Instagram: https://www.instagram.com/reel/...?igsh=... or /p/...
      // Try to get from URL params or extract differently
      // Instagram URLs don't always contain the username in the path
      // But sometimes: https://www.instagram.com/username/reel/...
      const parts = pathname.split('/').filter(Boolean)
      if (parts.length > 0 && !['p', 'reel', 'reels', 'tv', 'stories'].includes(parts[0])) {
        return parts[0]
      }
    } else if (platform === 'YOUTUBE') {
      // YouTube: https://www.youtube.com/@username/shorts/... or /shorts/...
      const match = pathname.match(/\/@([^/]+)/)
      if (match) return match[1]
      // YouTube shorts without handle: https://youtube.com/shorts/videoId
    } else if (platform === 'TWITTER') {
      // Twitter/X: https://twitter.com/username/status/... or https://x.com/username/...
      const parts = pathname.split('/').filter(Boolean)
      if (parts.length > 0 && parts[0] !== 'i') {
        return parts[0]
      }
    }
  } catch {
    // Invalid URL
  }
  return null
}

const updateCampaignSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().min(10, "Description must be at least 10 characters").optional(),
  creator: z.string().min(1, "Creator name is required").optional(),
  budget: z.number().positive("Budget must be positive").optional(),
  spent: z.number().min(0, "Spent amount cannot be negative").optional(),
  reservedAmount: z.number().min(0, "Reserved amount cannot be negative").optional(), // For fees/bounties (admin only)
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
        // reservedAmount may not exist yet - handled below
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
        // budgetReachedAt and budgetReachedViews may not exist yet - query them separately
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
            },
            socialAccount: {
              select: {
                id: true,
                platform: true,
                username: true,
                displayName: true,
                verified: true
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

      // Use verified social account they selected when submitting
      const socialAccount = sub.socialAccount || null
      
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
        },
        socialAccount: socialAccount ? {
          platform: socialAccount.platform,
          username: socialAccount.username,
          displayName: socialAccount.displayName,
          verified: socialAccount.verified
        } : null
      }
    })

    // Calculate stats
    const approvedSubmissions = processedSubmissions.filter(s => s.status === 'APPROVED')
    const unapprovedSubmissions = processedSubmissions.filter(s => s.status !== 'APPROVED')
    
    const totalEarnings = approvedSubmissions.reduce((sum, s) => sum + s.earnings, 0)
    const totalViews = approvedSubmissions.reduce((sum, s) => sum + s.currentViews, 0)
    const totalViewsGained = approvedSubmissions.reduce((sum, s) => sum + s.viewsGained, 0)
    
    // Views from ALL submissions (approved + unapproved)
    const totalSubmittedViews = processedSubmissions.reduce((sum, s) => sum + s.currentViews, 0)
    const unapprovedViews = unapprovedSubmissions.reduce((sum, s) => sum + s.currentViews, 0)
    
    // Count unique clippers (different user accounts who submitted)
    const uniqueClipperIds = new Set(processedSubmissions.map(s => s.user.id))
    const uniqueClippers = uniqueClipperIds.size
    
    // Count unique approved clippers (clippers with at least one approved submission)
    const uniqueApprovedClipperIds = new Set(approvedSubmissions.map(s => s.user.id))
    const uniqueApprovedClippers = uniqueApprovedClipperIds.size
    
    // Aggregate unique social handles with their stats
    const handleStatsMap = new Map<string, {
      platform: string
      username: string
      displayName: string | null
      isVerified: boolean  // Whether this is from a verified social account
      userId: string
      userName: string | null
      userEmail: string | null
      clipCount: number
      approvedClipCount: number
      totalViews: number // All views from this page (approved + unapproved)
      approvedViews: number // Only approved views
      totalEarnings: number
    }>()
    
    for (const sub of processedSubmissions) {
      // Create a unique key based on verified social account they selected
      const verifiedHandle = sub.socialAccount?.username
      const urlHandle = extractHandleFromUrl(sub.clipUrl, sub.platform)
      const handle = verifiedHandle || urlHandle || sub.user.email?.split('@')[0] || sub.user.id
      const isVerified = !!verifiedHandle
      const key = `${sub.platform}:${handle.toLowerCase()}`  // Normalize to lowercase
      
      const existing = handleStatsMap.get(key)
      if (existing) {
        existing.clipCount++
        existing.totalViews += sub.currentViews // Track ALL views
        if (sub.status === 'APPROVED') {
          existing.approvedClipCount++
          existing.approvedViews += sub.currentViews
          existing.totalEarnings += sub.earnings
        }
      } else {
        handleStatsMap.set(key, {
          platform: sub.platform,
          username: handle,
          displayName: sub.socialAccount?.displayName || sub.user.name,
          isVerified,
          userId: sub.user.id,
          userName: sub.user.name,
          userEmail: sub.user.email,
          clipCount: 1,
          approvedClipCount: sub.status === 'APPROVED' ? 1 : 0,
          totalViews: sub.currentViews, // Track ALL views
          approvedViews: sub.status === 'APPROVED' ? sub.currentViews : 0,
          totalEarnings: sub.status === 'APPROVED' ? sub.earnings : 0
        })
      }
    }
    
    // Convert to array - all pages that submitted (for reference)
    const allSubmittedPages = Array.from(handleStatsMap.values())
    
    // Filter to only pages with approved clips and sort by earnings
    const participatingCreators = allSubmittedPages
      .filter(c => c.approvedClipCount > 0)
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
    
    // Count unique pages by status
    const totalPagesSubmitted = allSubmittedPages.length
    const approvedPages = participatingCreators.length
    const verifiedPages = participatingCreators.filter(c => c.isVerified).length
    const unverifiedPages = approvedPages - verifiedPages
    
    // Platform breakdown
    const platformBreakdown = processedSubmissions.reduce((acc, sub) => {
      const platform = sub.platform
      if (!acc[platform]) {
        acc[platform] = { submissions: 0, approved: 0, views: 0, earnings: 0 }
      }
      acc[platform].submissions++
      if (sub.status === 'APPROVED') {
        acc[platform].approved++
        acc[platform].views += sub.currentViews
        acc[platform].earnings += sub.earnings
      }
      return acc
    }, {} as Record<string, { submissions: number, approved: number, views: number, earnings: number }>)

    // Convert Prisma Decimal types to numbers for proper client-side comparison
    const budgetNum = Number(campaign.budget)
    const spentNum = Number(campaign.spent ?? 0)
    const reservedNum = 0 // reservedAmount column may not exist yet
    const effectiveBudget = budgetNum - reservedNum
    
    return NextResponse.json({
      ...campaign,
      budget: budgetNum,
      spent: spentNum,
      reservedAmount: reservedNum,
      effectiveBudget, // Actual clipper payout budget (budget - reserved)
      payoutRate: Number(campaign.payoutRate),
      clipSubmissions: processedSubmissions,
      stats: {
        totalSubmissions: campaign._count.clipSubmissions,
        approvedCount: approvedSubmissions.length,
        pendingCount: processedSubmissions.filter(s => s.status === 'PENDING').length,
        rejectedCount: processedSubmissions.filter(s => s.status === 'REJECTED').length,
        uniqueClippers, // Total unique users who submitted (any status)
        uniqueApprovedClippers, // Unique users with approved submissions
        totalPagesSubmitted, // All unique pages that submitted (any status)
        uniquePages: approvedPages, // Unique pages with approved clips
        verifiedPages, // Pages from verified social accounts
        unverifiedPages, // Pages without verified social account link
        totalEarnings,
        totalViews, // Views from approved clips only
        totalViewsGained,
        totalSubmittedViews, // Views from ALL submissions (approved + unapproved)
        unapprovedViews, // Views from rejected/pending submissions
        // Views at completion = earnings paid out × 1000 (since $1 per 1K views)
        // This represents views that were counted toward earnings
        viewsAtCompletion: Math.round(totalEarnings * 1000),
        // Extra tracked = total views - views that generated earnings
        viewsAfterCompletion: Math.max(0, totalViews - Math.round(totalEarnings * 1000)),
        // Use effective budget for utilization calculation
        budgetUtilization: effectiveBudget > 0 
          ? (spentNum / effectiveBudget) * 100 
          : 0,
        remainingBudget: Math.max(0, effectiveBudget - spentNum)
      },
      participatingCreators, // List of unique handles with their stats
      platformBreakdown // Breakdown by platform
    })
  } catch (error) {
    console.error("Error fetching campaign:", error)
    // Return detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const errorStack = error instanceof Error ? error.stack : undefined
    return NextResponse.json({ 
      error: "Internal server error",
      message: errorMessage,
      stack: errorStack?.split('\n').slice(0, 5).join('\n')
    }, { status: 500 })
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
    if (validatedData.reservedAmount !== undefined) updateData.reservedAmount = validatedData.reservedAmount
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
