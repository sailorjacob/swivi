// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { waitUntil } from "@vercel/functions"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { RateLimitingService } from "@/lib/rate-limiting-service"
import { SubmissionVerificationService } from "@/lib/submission-verification-service"
import { SocialUrlParser } from "@/lib/social-url-parser"
import { z } from "zod"

const createSubmissionSchema = z.object({
  campaignId: z.string(),
  clipUrl: z.string().url(),
  platform: z.enum(["TIKTOK", "YOUTUBE", "INSTAGRAM", "TWITTER", "FACEBOOK"]),
  mediaFileUrl: z.string().url().optional(),
  socialAccountId: z.string().optional(), // Links to verified social account used for submission
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
        initialViews: true,
        finalEarnings: true,
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

    // Convert BigInt values to strings for JSON serialization
    const submissionsResponse = submissions.map(sub => ({
      ...sub,
      initialViews: sub.initialViews ? sub.initialViews.toString() : "0",
      finalEarnings: sub.finalEarnings ? sub.finalEarnings.toString() : "0",
      payout: sub.payout ? sub.payout.toString() : null,
    }))

    return NextResponse.json(submissionsResponse)
  } catch (error) {
    console.error("Error fetching submissions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  console.log('📥 ============= NEW SUBMISSION REQUEST =============')
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      console.error('❌ Unauthorized submission attempt:', { user, error })
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    console.log('✅ User authenticated:', { userId: user.id, email: user.email })

    // Get the internal user ID from the database using supabaseAuthId
    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { 
        id: true,
        role: true // Need role to check for admin bypass
      }
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const isAdmin = dbUser.role === 'ADMIN'

    // Rate limiting check
    const rateLimitingService = RateLimitingService.getInstance()
    const userIdentifier = dbUser.id

    const rateLimitResult = await rateLimitingService.checkRateLimit(
      userIdentifier,
      'submission:create'
    )

    if (!rateLimitResult.success) {
      await rateLimitingService.recordViolation(
        userIdentifier,
        'submission:create',
        request.headers.get('user-agent') || undefined,
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
      )

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
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

    // Check if campaign budget is exhausted
    // CRITICAL: Convert Decimal objects to numbers for proper comparison
    // Prisma Decimal types don't support direct JS comparison operators
    const spentAmount = Number(campaign.spent ?? 0)
    const budgetAmount = Number(campaign.budget)
    
    console.log(`💰 Budget check: spent=${spentAmount}, budget=${budgetAmount}, exhausted=${spentAmount >= budgetAmount}`)
    
    if (spentAmount >= budgetAmount) {
      return NextResponse.json({ 
        error: "Campaign budget exhausted", 
        details: "This campaign has reached its budget limit and is no longer accepting submissions."
      }, { status: 400 })
    }

    // Parse the submitted URL to ensure it's valid and get platform info
    const parsedUrl = SocialUrlParser.parseUrl(validatedData.clipUrl)

    if (!parsedUrl.isValid) {
      return NextResponse.json({
        error: "Invalid social media URL",
        details: parsedUrl.error
      }, { status: 400 })
    }

    // Check for duplicate URL in the same campaign
    const existingSubmission = await prisma.clipSubmission.findFirst({
      where: {
        campaignId: validatedData.campaignId,
        clipUrl: validatedData.clipUrl
      }
    })

    if (existingSubmission) {
      return NextResponse.json({
        error: "Duplicate submission",
        details: "This URL has already been submitted to this campaign."
      }, { status: 400 })
    }

    // Admin bypass for testing - admins can submit any URL without verification
    if (!isAdmin) {
      // Verify platform access - user must have verified account for this platform
      const platformAccess = await SubmissionVerificationService.validatePlatformAccess(
        dbUser.id,
        parsedUrl.platform
      )

      if (!platformAccess.canSubmit) {
        return NextResponse.json({
          error: "Platform verification required",
          details: platformAccess.reason,
          requiresVerification: true
        }, { status: 403 })
      }

      // Verify that the submitted content belongs to one of the user's verified accounts
      const verificationResult = await SubmissionVerificationService.verifySubmissionOwnership({
        userId: dbUser.id,
        clipUrl: validatedData.clipUrl,
        platform: parsedUrl.platform
      })

      if (!verificationResult.isVerified) {
        // Create submission with REJECTED status if verification fails completely
        // or PENDING if it requires manual review
        const submissionStatus = verificationResult.requiresReview ? "PENDING" : "REJECTED"

        const submission = await prisma.clipSubmission.create({
          data: {
            userId: dbUser.id,
            campaignId: validatedData.campaignId,
            clipUrl: validatedData.clipUrl,
            platform: validatedData.platform,
            mediaFileUrl: validatedData.mediaFileUrl,
            socialAccountId: validatedData.socialAccountId, // Link to verified social account
            status: submissionStatus,
            rejectionReason: verificationResult.reason
          },
          include: {
            campaigns: true
          }
        })

        // Send notification for flagged submissions
        if (verificationResult.requiresReview) {
          await notifyAdminsOfFlaggedSubmission(submission.id, verificationResult.reviewReason!)
        }

        return NextResponse.json({
          ...submission,
          verificationFailed: true,
          reason: verificationResult.reason,
          requiresReview: verificationResult.requiresReview,
          reviewReason: verificationResult.reviewReason
        }, { status: verificationResult.requiresReview ? 202 : 403 })
      }
    } else {
      console.log('🔓 Admin bypass: Skipping social media verification for admin user')
    }

    // Fraud detection check (still apply to admins for testing realism)
    const fraudResult = await rateLimitingService.detectFraud(
      dbUser.id,
      'submission',
      { clipUrl: validatedData.clipUrl, platform: validatedData.platform }
    )

    if (fraudResult.action === 'block') {
      console.warn(`Blocked suspicious submission from user ${dbUser.id}:`, fraudResult.reasons)

      return NextResponse.json(
        {
          error: 'Submission blocked due to suspicious activity',
          reasons: fraudResult.reasons
        },
        { status: 403 }
      )
    }

    if (fraudResult.action === 'flag') {
      console.warn(`Flagged suspicious submission from user ${dbUser.id}:`, fraudResult.reasons)
      // Continue with submission but log for manual review
    }

    // Create the submission first, then scrape in background
    // This ensures fast UX while still capturing accurate initial views
    let submission
    try {
      submission = await prisma.clipSubmission.create({
        data: {
          userId: dbUser.id,
          campaignId: validatedData.campaignId,
          clipUrl: validatedData.clipUrl,
          platform: validatedData.platform,
          mediaFileUrl: validatedData.mediaFileUrl,
          socialAccountId: validatedData.socialAccountId, // Link to verified social account
          status: "PENDING",
          processingStatus: "SCRAPING", // Track that we're scraping initial views
          initialViews: BigInt(0) // Temporary - will be updated by background scrape
        },
        include: {
          campaigns: true
        }
      })
      
      console.log(`✅ Submission created successfully with ID: ${submission.id}`)
      
      // Start background scrape to get initial views (doesn't block response)
      // This runs AFTER submission is created, so we can update it with real views
      const submissionId = submission.id
      const clipUrl = validatedData.clipUrl
      const platform = validatedData.platform
      
      // Background scrape function - will be kept alive by waitUntil
      const backgroundScrape = async () => {
        try {
          const { MultiPlatformScraper } = await import('@/lib/multi-platform-scraper')
          const apifyKey = process.env.APIFY_API_KEY || ''
          
          if (!apifyKey) {
            console.error(`❌ APIFY_API_KEY not set - cannot scrape initial views for ${submissionId}`)
            await prisma.clipSubmission.update({
              where: { id: submissionId },
              data: { processingStatus: "SCRAPE_FAILED_NO_API_KEY" }
            })
            return
          }
          
          const scraper = new MultiPlatformScraper(apifyKey)
          console.log(`🔍 Starting background initial view scrape for submission ${submissionId}`)
          
          const scrapedData = await Promise.race([
            scraper.scrapeContent(clipUrl, platform),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Scrape timeout after 90s')), 90000)) // 90 seconds
          ]) as any
          
          if (scrapedData && !scrapedData.error) {
            const rawViews = scrapedData.views || scrapedData.viewCount || 0
            const views = typeof rawViews === 'string' ? parseInt(rawViews, 10) : rawViews
            
            // Update even if views is 0 - this means scraping worked but content has 0 views
            const finalViews = !isNaN(views) ? views : 0
            
            await prisma.clipSubmission.update({
              where: { id: submissionId },
              data: {
                initialViews: BigInt(finalViews),
                processingStatus: "COMPLETE"
              }
            })
            console.log(`📊 Background scrape updated submission ${submissionId} with ${finalViews} initial views`)
          } else {
            console.error(`⚠️ Background scrape failed for ${submissionId}: ${scrapedData?.error || 'Unknown error'}`)
            await prisma.clipSubmission.update({
              where: { id: submissionId },
              data: { processingStatus: `SCRAPE_FAILED: ${scrapedData?.error || 'Unknown error'}`.substring(0, 100) }
            })
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown'
          console.error(`⚠️ Background scrape error for ${submissionId}:`, errorMsg)
          // Update status so we know it failed
          try {
            await prisma.clipSubmission.update({
              where: { id: submissionId },
              data: { processingStatus: `SCRAPE_ERROR: ${errorMsg}`.substring(0, 100) }
            })
          } catch (updateError) {
            console.error(`Failed to update scrape error status:`, updateError)
          }
        }
      }
      
      // waitUntil tells Vercel: "keep this function alive until this promise resolves"
      // This ensures the background scrape completes even after the response is sent
      waitUntil(backgroundScrape())
      
      console.log(`🚀 Background scrape started for submission ${submissionId} (response returning immediately)`)
      
      // Convert BigInt to string for JSON serialization
      const submissionResponse = {
        ...submission,
        initialViews: submission.initialViews ? submission.initialViews.toString() : "0",
        finalEarnings: submission.finalEarnings ? submission.finalEarnings.toString() : "0",
        payout: submission.payout ? submission.payout.toString() : null,
      }
      
      return NextResponse.json(submissionResponse, { status: 201 })
    } catch (dbError: any) {
      console.error('❌ Database error creating submission:', dbError)
      console.error('❌ Error details:', {
        message: dbError.message,
        code: dbError.code,
        meta: dbError.meta
      })
      
      // Check if it's a missing column error
      if (dbError.message?.includes('initialViews') || dbError.message?.includes('column')) {
        return NextResponse.json({
          error: "Database migration required",
          details: "The 'initialViews' column is missing. Please run the database migration.",
          migrationInstructions: "See APPLY_MIGRATION.md for instructions"
        }, { status: 500 })
      }
      
      // Check for BigInt conversion errors
      if (dbError.message?.includes('BigInt')) {
        return NextResponse.json({
          error: "Invalid view count",
          details: "Could not process view count for submission"
        }, { status: 500 })
      }
      
      // Generic database error
      return NextResponse.json({
        error: "Failed to create submission",
        details: dbError.message || "Database error",
        debugInfo: process.env.NODE_ENV === 'development' ? dbError : undefined
      }, { status: 500 })
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error('❌ Validation error:', error.errors)
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 })
    }

    console.error("❌ Error creating submission:", error)
    console.error("❌ Error stack:", error?.stack)
    console.error("❌ Error details:", {
      message: error?.message,
      name: error?.name,
      code: error?.code,
    })
    
    return NextResponse.json({ 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      hint: "Check server logs for more details"
    }, { status: 500 })
  }
}

async function notifyAdminsOfFlaggedSubmission(submissionId: string, reviewReason: string) {
  try {
    // Get all admin users
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true }
    })

    if (admins.length === 0) {
      console.warn("No admin users found to notify about flagged submission")
      return
    }

    // Get submission details for notification
    const submission = await prisma.clipSubmission.findUnique({
      where: { id: submissionId },
      include: {
        users: { select: { name: true, email: true } },
        campaigns: { select: { title: true } }
      }
    })

    if (!submission) {
      console.warn(`Submission ${submissionId} not found for notification`)
      return
    }

    // Create notifications for all admins
    const notifications = admins.map(admin => ({
      userId: admin.id,
      type: "SYSTEM_UPDATE" as const,
      title: "Submission Requires Review",
      message: `Submission from ${submission.users.name || submission.users.email} for campaign "${submission.campaigns.title}" requires manual review.`,
      data: {
        submissionId,
        reviewReason,
        campaignTitle: submission.campaigns.title,
        submitterName: submission.users.name,
        submitterEmail: submission.users.email
      }
    }))

    await prisma.notification.createMany({
      data: notifications
    })

    console.log(`Notified ${admins.length} admins about flagged submission ${submissionId}`)
  } catch (error) {
    console.error("Error notifying admins of flagged submission:", error)
  }
}
