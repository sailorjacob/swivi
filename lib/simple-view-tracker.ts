import { prisma } from '@/lib/prisma'
import { MultiPlatformScraper } from '@/lib/multi-platform-scraper'
import { SocialPlatform } from '@prisma/client'

/**
 * Simple, reliable view tracker that processes clips ONE BY ONE
 * 
 * Philosophy:
 * - Process sequentially, not in parallel (no race conditions)
 * - Pick the clip that hasn't been tracked in the longest time
 * - Update the database immediately after each scrape
 * - Take as long as needed - reliability over speed
 * - If one fails, move to the next (don't stop everything)
 */
export class SimpleViewTracker {
  private scraper: MultiPlatformScraper | null = null

  constructor() {
    const apifyKey = process.env.APIFY_API_KEY
    if (apifyKey) {
      this.scraper = new MultiPlatformScraper(apifyKey)
    }
  }

  /**
   * Get the next clip that needs tracking (oldest tracked first)
   */
  private async getNextClipToTrack(): Promise<{
    clipId: string
    url: string
    platform: SocialPlatform
    userId: string
    campaignId: string
    campaignTitle: string
    submissionStatus: string
    lastTracked: Date | null
  } | null> {
    // Find the clip that was tracked longest ago (or never)
    // Only from active campaigns, approved or pending submissions
    const submission = await prisma.clipSubmission.findFirst({
      where: {
        clipId: { not: null },
        status: { in: ['APPROVED', 'PENDING'] },
        campaigns: {
          status: 'ACTIVE',
          isTest: false,
          deletedAt: null
        }
      },
      include: {
        clips: {
          include: {
            view_tracking: {
              orderBy: { scrapedAt: 'desc' },
              take: 1
            }
          }
        },
        campaigns: {
          select: { id: true, title: true, payoutRate: true, budget: true, spent: true }
        }
      },
      orderBy: [
        // Prioritize clips that have never been tracked or tracked longest ago
        // This uses the clip's updatedAt as a proxy (we'll improve this)
      ]
    })

    if (!submission || !submission.clips) return null

    const lastTracking = submission.clips.view_tracking[0]

    return {
      clipId: submission.clipId!,
      url: submission.clipUrl,
      platform: submission.platform,
      userId: submission.userId,
      campaignId: submission.campaignId,
      campaignTitle: submission.campaigns.title,
      submissionStatus: submission.status,
      lastTracked: lastTracking?.scrapedAt || null
    }
  }

  /**
   * Get clips sorted by how long since they were last tracked
   * Clips never tracked come first, then oldest tracked
   */
  async getClipsToTrack(limit: number = 100): Promise<Array<{
    clipId: string
    url: string
    platform: SocialPlatform
    userId: string
    campaignId: string
    campaignTitle: string
    submissionStatus: string
    submissionId: string
    isApproved: boolean
    initialViews: bigint
    lastTracked: Date | null
    payoutRate: number
    campaignBudget: number
    campaignSpent: number
  }>> {
    // Get all submissions with clips from active campaigns
    const submissions = await prisma.clipSubmission.findMany({
      where: {
        clipId: { not: null },
        status: { in: ['APPROVED', 'PENDING'] },
        campaigns: {
          status: 'ACTIVE',
          isTest: false,
          deletedAt: null
        }
      },
      include: {
        clips: {
          include: {
            view_tracking: {
              orderBy: { scrapedAt: 'desc' },
              take: 1
            }
          }
        },
        campaigns: {
          select: { id: true, title: true, payoutRate: true, budget: true, spent: true }
        }
      }
    })

    // Map and sort by last tracked time (null = never tracked = highest priority)
    const clipsWithTracking = submissions
      .filter(s => s.clips)
      .map(s => ({
        clipId: s.clipId!,
        url: s.clipUrl,
        platform: s.platform,
        userId: s.userId,
        campaignId: s.campaignId,
        campaignTitle: s.campaigns.title,
        submissionStatus: s.status,
        submissionId: s.id,
        isApproved: s.status === 'APPROVED',
        initialViews: s.initialViews || BigInt(0),
        lastTracked: s.clips!.view_tracking[0]?.scrapedAt || null,
        payoutRate: Number(s.campaigns.payoutRate),
        campaignBudget: Number(s.campaigns.budget),
        campaignSpent: Number(s.campaigns.spent)
      }))
      .sort((a, b) => {
        // Never tracked clips first
        if (!a.lastTracked && !b.lastTracked) return 0
        if (!a.lastTracked) return -1
        if (!b.lastTracked) return 1
        // Then by oldest tracked
        return a.lastTracked.getTime() - b.lastTracked.getTime()
      })

    return clipsWithTracking.slice(0, limit)
  }

  /**
   * Track a single clip - scrape views and update database
   * Returns true if successful, false if failed
   */
  async trackSingleClip(clip: {
    clipId: string
    url: string
    platform: SocialPlatform
    userId: string
    campaignId: string
    isApproved: boolean
    initialViews: bigint
    payoutRate: number
    campaignBudget: number
    campaignSpent: number
  }): Promise<{
    success: boolean
    views?: number
    viewsGained?: number
    earningsAdded?: number
    error?: string
  }> {
    if (!this.scraper) {
      return { success: false, error: 'No Apify API key configured' }
    }

    try {
      // 1. Scrape current views
      const scrapedData = await this.scraper.scrapeContent(clip.url, clip.platform)

      if (scrapedData.error || scrapedData.views === undefined) {
        return { 
          success: false, 
          error: scrapedData.error || 'No views returned from scraper'
        }
      }

      const currentViews = scrapedData.views
      const now = new Date()
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // 2. Get previous views from last tracking record
      const lastTracking = await prisma.viewTracking.findFirst({
        where: { clipId: clip.clipId },
        orderBy: { scrapedAt: 'desc' }
      })
      const previousViews = lastTracking ? Number(lastTracking.views) : 0
      const viewsGained = Math.max(0, currentViews - previousViews)

      // 3. Create new tracking record
      await prisma.viewTracking.create({
        data: {
          userId: clip.userId,
          clipId: clip.clipId,
          views: BigInt(currentViews),
          date: today,
          platform: clip.platform,
          scrapedAt: now
        }
      })

      // 4. Update clip's current views
      await prisma.clip.update({
        where: { id: clip.clipId },
        data: {
          views: BigInt(currentViews),
          likes: BigInt(scrapedData.likes || 0),
          shares: BigInt(scrapedData.shares || 0)
        }
      })

      // 5. Calculate and add earnings (only for approved clips)
      let earningsAdded = 0
      if (clip.isApproved) {
        const initialViews = Number(clip.initialViews)
        const totalViewGrowth = currentViews - initialViews
        const totalEarningsShouldBe = (totalViewGrowth / 1000) * clip.payoutRate

        // Cap at 30% of campaign budget per clip
        const maxClipEarnings = clip.campaignBudget * 0.30
        const cappedEarnings = Math.min(totalEarningsShouldBe, maxClipEarnings)

        // Get current clip earnings
        const currentClip = await prisma.clip.findUnique({
          where: { id: clip.clipId },
          select: { earnings: true }
        })
        const currentClipEarnings = Number(currentClip?.earnings || 0)
        const earningsDelta = Math.max(0, cappedEarnings - currentClipEarnings)

        // Check budget remaining
        const remainingBudget = Math.max(0, clip.campaignBudget - clip.campaignSpent)
        earningsAdded = Math.min(earningsDelta, remainingBudget)

        if (earningsAdded > 0) {
          // Update clip earnings
          await prisma.clip.update({
            where: { id: clip.clipId },
            data: { earnings: { increment: earningsAdded } }
          })

          // Update user earnings
          await prisma.user.update({
            where: { id: clip.userId },
            data: { 
              totalEarnings: { increment: earningsAdded },
              totalViews: { increment: viewsGained }
            }
          })

          // Update campaign spent
          await prisma.campaign.update({
            where: { id: clip.campaignId },
            data: { spent: { increment: earningsAdded } }
          })
        }
      }

      return {
        success: true,
        views: currentViews,
        viewsGained,
        earningsAdded
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Main tracking loop - processes clips one by one
   * Runs until time budget is exhausted or all clips are processed
   */
  async runTrackingLoop(options: {
    maxDurationMs?: number  // Stop after this many milliseconds
    maxClips?: number       // Stop after processing this many clips
    delayBetweenMs?: number // Wait this long between clips
  } = {}): Promise<{
    processed: number
    successful: number
    failed: number
    totalEarningsAdded: number
    totalViewsGained: number
    stoppedReason: 'time_limit' | 'clip_limit' | 'all_done'
  }> {
    const {
      maxDurationMs = 260000, // 260 seconds default (leave buffer for 300s timeout)
      maxClips = 200,
      delayBetweenMs = 1000   // 1 second between clips
    } = options

    const startTime = Date.now()
    let processed = 0
    let successful = 0
    let failed = 0
    let totalEarningsAdded = 0
    let totalViewsGained = 0

    // Get all clips that need tracking, sorted by priority
    const clipsToTrack = await this.getClipsToTrack(maxClips)
    console.log(`📋 Found ${clipsToTrack.length} clips to track`)

    if (clipsToTrack.length === 0) {
      return {
        processed: 0,
        successful: 0,
        failed: 0,
        totalEarningsAdded: 0,
        totalViewsGained: 0,
        stoppedReason: 'all_done'
      }
    }

    for (const clip of clipsToTrack) {
      // Check time budget
      const elapsed = Date.now() - startTime
      if (elapsed >= maxDurationMs) {
        console.log(`⏱️ Time limit reached (${elapsed}ms), stopping`)
        return {
          processed,
          successful,
          failed,
          totalEarningsAdded,
          totalViewsGained,
          stoppedReason: 'time_limit'
        }
      }

      // Process this clip
      const timeSinceLastTrack = clip.lastTracked 
        ? Math.round((Date.now() - clip.lastTracked.getTime()) / 60000) 
        : 'never'
      console.log(`🔍 [${processed + 1}/${clipsToTrack.length}] Tracking clip ${clip.clipId.substring(0, 8)}... (last: ${timeSinceLastTrack}${typeof timeSinceLastTrack === 'number' ? 'm ago' : ''})`)

      const result = await this.trackSingleClip(clip)
      processed++

      if (result.success) {
        successful++
        totalViewsGained += result.viewsGained || 0
        totalEarningsAdded += result.earningsAdded || 0
        console.log(`   ✅ ${result.views?.toLocaleString()} views (+${result.viewsGained?.toLocaleString()}) ${result.earningsAdded ? `$${result.earningsAdded.toFixed(2)}` : ''}`)
      } else {
        failed++
        console.log(`   ❌ Failed: ${result.error}`)
      }

      // Small delay between clips to be nice to Apify
      if (processed < clipsToTrack.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenMs))
      }
    }

    return {
      processed,
      successful,
      failed,
      totalEarningsAdded,
      totalViewsGained,
      stoppedReason: processed >= maxClips ? 'clip_limit' : 'all_done'
    }
  }
}

