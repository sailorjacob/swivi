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
 * - Fix initialViews = 0 issues automatically
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
   * Wraps a promise with a timeout
   * If the promise doesn't resolve within the timeout, it rejects
   */
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
      )
    ])
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
    // Debug: Log what we're looking for
    const [activeCampaignCount, totalSubmissions, submissionsWithClipId, eligibleCount] = await Promise.all([
      prisma.campaign.count({ where: { status: 'ACTIVE', isTest: false, deletedAt: null } }),
      prisma.clipSubmission.count(),
      prisma.clipSubmission.count({ where: { clipId: { not: null } } }),
      prisma.clipSubmission.count({
        where: {
          clipId: { not: null },
          status: { in: ['APPROVED', 'PENDING'] },
          campaigns: { status: 'ACTIVE', isTest: false, deletedAt: null }
        }
      })
    ])
    console.log(`📊 Tracking eligibility: ${activeCampaignCount} active campaigns, ${totalSubmissions} total submissions, ${submissionsWithClipId} with clipId, ${eligibleCount} eligible for tracking`)

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
   * Includes 60s timeout per clip to fail fast
   * Automatically fixes initialViews = 0 issues
   */
  async trackSingleClip(clip: {
    clipId: string
    url: string
    platform: SocialPlatform
    userId: string
    campaignId: string
    submissionId: string
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
    initialViewsFixed?: boolean
    error?: string
  }> {
    if (!this.scraper) {
      return { success: false, error: 'No Apify API key configured' }
    }

    try {
      // 1. Scrape current views with 60s timeout
      const scrapedData = await this.withTimeout(
        this.scraper.scrapeContent(clip.url, clip.platform),
        60000,
        `Scrape timeout after 60s for ${clip.platform}`
      )

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

      // 3. Use initialViews directly - 0 means clipper earns from ALL views
      let initialViewsFixed = false
      const effectiveInitialViews = Number(clip.initialViews)
      
      // Log if this is a first-time scrape with no tracking history
      if (!lastTracking && effectiveInitialViews === 0) {
        console.log(`   📊 First scrape - clipper earns from all ${currentViews.toLocaleString()} views`)
      }

      // 4. Create new tracking record (ALWAYS creates, never updates - preserves history)
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

      // 5. Update clip's current views - only if higher (views should never decrease)
      const existingClip = await prisma.clip.findUnique({
        where: { id: clip.clipId },
        select: { views: true }
      })
      const existingViews = Number(existingClip?.views || 0)
      
      // Only update if new views are higher (protects against scraper returning lower values)
      const newViews = Math.max(existingViews, currentViews)
      const viewsGained = Math.max(0, newViews - previousViews)
      
      if (newViews > existingViews) {
        console.log(`   📈 Views updated: ${existingViews.toLocaleString()} → ${newViews.toLocaleString()} (+${viewsGained.toLocaleString()})`)
      }
      
      await prisma.clip.update({
        where: { id: clip.clipId },
        data: {
          views: BigInt(newViews),
          likes: BigInt(scrapedData.likes || 0),
          shares: BigInt(scrapedData.shares || 0)
        }
      })

      // 6. Calculate and add earnings (only for approved clips)
      let earningsAdded = 0
      if (clip.isApproved) {
        // Use the higher view count (newViews) for earnings calculation
        const totalViewGrowth = Math.max(0, newViews - effectiveInitialViews)
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

          // Update user earnings and views
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
        views: newViews,
        viewsGained,
        earningsAdded,
        initialViewsFixed
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
    initialViewsFixed: number
    stoppedReason: 'time_limit' | 'clip_limit' | 'all_done'
  }> {
    const {
      maxDurationMs = 240000, // 240 seconds default (leave 60s buffer for 300s timeout)
      maxClips = 50,          // Conservative default
      delayBetweenMs = 500    // 500ms between clips
    } = options

    const startTime = Date.now()
    let processed = 0
    let successful = 0
    let failed = 0
    let totalEarningsAdded = 0
    let totalViewsGained = 0
    let initialViewsFixed = 0

    // Get all clips that need tracking, sorted by priority
    const clipsToTrack = await this.getClipsToTrack(maxClips)
    console.log(`📋 Found ${clipsToTrack.length} clips to track (max: ${maxClips})`)

    if (clipsToTrack.length === 0) {
      console.log(`✨ No clips need tracking right now`)
      return {
        processed: 0,
        successful: 0,
        failed: 0,
        totalEarningsAdded: 0,
        totalViewsGained: 0,
        initialViewsFixed: 0,
        stoppedReason: 'all_done'
      }
    }

    for (const clip of clipsToTrack) {
      // Check time budget before starting next clip
      const elapsed = Date.now() - startTime
      const remaining = maxDurationMs - elapsed
      
      if (remaining < 65000) { // Need at least 65s for one more clip (60s scrape + 5s buffer)
        console.log(`⏱️ Time budget low (${Math.round(remaining/1000)}s remaining), stopping gracefully`)
        return {
          processed,
          successful,
          failed,
          totalEarningsAdded,
          totalViewsGained,
          initialViewsFixed,
          stoppedReason: 'time_limit'
        }
      }

      // Process this clip
      const timeSinceLastTrack = clip.lastTracked 
        ? `${Math.round((Date.now() - clip.lastTracked.getTime()) / 60000)}m ago`
        : 'never'
      const statusLabel = clip.isApproved ? '✓' : '○'
      
      console.log(`🔍 [${processed + 1}/${clipsToTrack.length}] ${statusLabel} ${clip.platform} clip ${clip.clipId.substring(0, 8)}... (last: ${timeSinceLastTrack})`)

      const result = await this.trackSingleClip({
        ...clip,
        submissionId: clip.submissionId
      })
      processed++

      if (result.success) {
        successful++
        totalViewsGained += result.viewsGained || 0
        totalEarningsAdded += result.earningsAdded || 0
        if (result.initialViewsFixed) initialViewsFixed++
        
        const earningsStr = result.earningsAdded && result.earningsAdded > 0 
          ? ` → $${result.earningsAdded.toFixed(2)}` 
          : ''
        console.log(`   ✅ ${result.views?.toLocaleString()} views (+${result.viewsGained?.toLocaleString()})${earningsStr}`)
      } else {
        failed++
        console.log(`   ❌ ${result.error}`)
      }

      // Small delay between clips
      if (processed < clipsToTrack.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenMs))
      }
    }

    const totalSeconds = Math.round((Date.now() - startTime) / 1000)
    console.log(`\n📊 Tracking complete in ${totalSeconds}s: ${successful}/${processed} successful`)
    console.log(`   💰 Total earnings added: $${totalEarningsAdded.toFixed(2)}`)

    return {
      processed,
      successful,
      failed,
      totalEarningsAdded,
      totalViewsGained,
      initialViewsFixed,
      stoppedReason: processed >= maxClips ? 'clip_limit' : 'all_done'
    }
  }
}
