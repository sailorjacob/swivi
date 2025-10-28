import { prisma } from '@/lib/prisma'
import { SocialUrlParser } from '@/lib/social-url-parser'
import { SocialPlatform } from '@prisma/client'
import { MultiPlatformScraper } from '@/lib/multi-platform-scraper'

export interface CreateClipData {
  submissionId: string
  userId: string
  campaignId: string
  clipUrl: string
  platform: SocialPlatform
}

export interface ClipCreationResult {
  success: boolean
  clipId?: string
  error?: string
  initialViews?: number
  metadata?: {
    title?: string
    description?: string
    author?: string
    createdAt?: Date
  }
}

/**
 * Service for creating Clip records from verified submissions and starting view tracking
 */
export class ClipCreationService {
  private scraper: MultiPlatformScraper

  constructor() {
    // Initialize scraper with Apify token from environment
    this.scraper = new MultiPlatformScraper(process.env.APIFY_TOKEN || '')
  }

  /**
   * Creates a Clip record for a verified submission and starts view tracking
   */
  async createClipFromSubmission(createData: CreateClipData): Promise<ClipCreationResult> {
    try {
      // Get submission details
      const submission = await prisma.clipSubmission.findUnique({
        where: { id: createData.submissionId },
        include: {
          users: { select: { id: true, name: true } },
          campaigns: { select: { id: true, title: true, payoutRate: true } }
        }
      })

      if (!submission) {
        return {
          success: false,
          error: 'Submission not found'
        }
      }

      if (submission.status !== 'PENDING') {
        return {
          success: false,
          error: 'Only pending submissions can be converted to clips'
        }
      }

      // Parse URL to get post information
      const parsedUrl = SocialUrlParser.parseUrl(createData.clipUrl)

      if (!parsedUrl.isValid || !parsedUrl.postId) {
        return {
          success: false,
          error: 'Invalid post URL - cannot extract post ID'
        }
      }

      // Scrape initial content data from the platform
      const scrapedData = await this.scraper.scrapeContent(createData.clipUrl, createData.platform)

      if (scrapedData.error) {
        console.warn(`Failed to scrape initial data for ${createData.clipUrl}:`, scrapedData.error)
        // Continue with clip creation even if scraping fails
      }

      // Create the Clip record
      const clip = await prisma.clip.create({
        data: {
          userId: createData.userId,
          url: createData.clipUrl,
          platform: createData.platform,
          title: scrapedData.title || `Content from ${createData.platform}`,
          description: scrapedData.description || '',
          views: BigInt(scrapedData.views || 0),
          likes: BigInt(scrapedData.likes || 0),
          shares: BigInt(scrapedData.shares || 0),
          status: 'ACTIVE'
        }
      })

      // Update submission to link to the clip and mark as approved
      // Store initialViews for earnings calculation
      await prisma.clipSubmission.update({
        where: { id: createData.submissionId },
        data: {
          clipId: clip.id,
          status: 'APPROVED',
          initialViews: BigInt(scrapedData.views || 0),
          rejectionReason: null // Clear any previous rejection reason
        }
      })

      // Create initial view tracking record for today
      if (scrapedData.views && scrapedData.views > 0) {
        await this.createInitialViewTracking(clip.id, createData.userId, scrapedData.views, createData.platform)
      }

      // Send notification to user about approval
      await this.notifyUserOfApproval(createData.userId, submission.campaigns.title, clip.id)

      return {
        success: true,
        clipId: clip.id,
        initialViews: scrapedData.views || 0,
        metadata: {
          title: scrapedData.title,
          description: scrapedData.description,
          author: scrapedData.author,
          createdAt: scrapedData.createdAt
        }
      }

    } catch (error) {
      console.error('Error creating clip from submission:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Creates initial view tracking record for a clip
   */
  private async createInitialViewTracking(
    clipId: string,
    userId: string,
    initialViews: number,
    platform: SocialPlatform
  ): Promise<void> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      await prisma.viewTracking.create({
        data: {
          userId,
          clipId,
          views: BigInt(initialViews),
          date: today,
          platform
        }
      })

      console.log(`Created initial view tracking for clip ${clipId}: ${initialViews} views`)
    } catch (error) {
      // Don't fail the entire operation if view tracking fails
      console.error('Error creating initial view tracking:', error)
    }
  }

  /**
   * Sends notification to user when their submission is approved and clip is created
   */
  private async notifyUserOfApproval(userId: string, campaignTitle: string, clipId: string): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId,
          type: 'SUBMISSION_APPROVED',
          title: 'Submission Approved!',
          message: `Your submission for "${campaignTitle}" has been approved and is now being tracked for views.`,
          data: {
            clipId,
            campaignTitle
          }
        }
      })
    } catch (error) {
      console.error('Error sending approval notification:', error)
    }
  }

  /**
   * Gets pending submissions that are ready to be converted to clips
   */
  async getPendingSubmissionsForClipCreation(limit: number = 50): Promise<Array<{
    id: string
    userId: string
    campaignId: string
    clipUrl: string
    platform: SocialPlatform
    createdAt: Date
  }>> {
    return await prisma.clipSubmission.findMany({
      where: {
        status: 'PENDING',
        clipId: null, // Only submissions not yet converted to clips
        // Add time-based filter to avoid processing very recent submissions
        createdAt: {
          lte: new Date(Date.now() - 5 * 60 * 1000) // At least 5 minutes old
        }
      },
      select: {
        id: true,
        userId: true,
        campaignId: true,
        clipUrl: true,
        platform: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: limit
    })
  }

  /**
   * Processes a batch of pending submissions and converts verified ones to clips
   */
  async processPendingSubmissionsBatch(limit: number = 10): Promise<{
    processed: number
    successful: number
    failed: number
    errors: Array<{ submissionId: string; error: string }>
  }> {
    const pendingSubmissions = await this.getPendingSubmissionsForClipCreation(limit)

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ submissionId: string; error: string }>
    }

    for (const submission of pendingSubmissions) {
      results.processed++

      try {
        const result = await this.createClipFromSubmission({
          submissionId: submission.id,
          userId: submission.userId,
          campaignId: submission.campaignId,
          clipUrl: submission.clipUrl,
          platform: submission.platform
        })

        if (result.success) {
          results.successful++
        } else {
          results.failed++
          results.errors.push({
            submissionId: submission.id,
            error: result.error || 'Unknown error'
          })
        }
      } catch (error) {
        results.failed++
        results.errors.push({
          submissionId: submission.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return results
  }
}
