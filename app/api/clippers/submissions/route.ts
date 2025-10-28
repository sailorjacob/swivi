// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
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

    // Parse the submitted URL to ensure it's valid and get platform info
    const parsedUrl = SocialUrlParser.parseUrl(validatedData.clipUrl)

    if (!parsedUrl.isValid) {
      return NextResponse.json({
        error: "Invalid social media URL",
        details: parsedUrl.error
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

    // Scrape initial views at submission time (CRITICAL: this is the baseline for earnings)
    let initialViews = 0
    try {
      const { MultiPlatformScraper } = await import('@/lib/multi-platform-scraper')
      const scraper = new MultiPlatformScraper(process.env.APIFY_API_KEY || '')
      const scrapedData = await scraper.scrapeContent(validatedData.clipUrl, validatedData.platform)
      initialViews = scrapedData.views || 0
      console.log(`📊 Initial views at submission: ${initialViews} for ${validatedData.clipUrl}`)
    } catch (error) {
      console.error('Error scraping initial views at submission:', error)
      // Continue with submission even if scraping fails
    }

    // Create the submission for verified content
    const submission = await prisma.clipSubmission.create({
      data: {
        userId: dbUser.id,
        campaignId: validatedData.campaignId,
        clipUrl: validatedData.clipUrl,
        platform: validatedData.platform,
        mediaFileUrl: validatedData.mediaFileUrl,
        status: "PENDING", // Still PENDING for admin approval, but verified
        initialViews: BigInt(initialViews) // SET AT SUBMISSION TIME - earnings baseline!
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
