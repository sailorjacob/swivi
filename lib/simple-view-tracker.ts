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
   * 
   * NOTE: We track both ACTIVE and COMPLETED campaigns!
   * - ACTIVE campaigns: track views AND calculate earnings
   * - COMPLETED campaigns: track views ONLY (for client reporting), no earnings
   */
  async getClipsToTrack(limit: number = 100): Promise<Array<{
    clipId: string
    url: string
    platform: SocialPlatform
    userId: string
    campaignId: string
    campaignTitle: string
    campaignStatus: string
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
    const [activeCampaignCount, completedCampaignCount, totalSubmissions, submissionsWithClipId, eligibleCount] = await Promise.all([
      prisma.campaign.count({ where: { status: 'ACTIVE', isTest: false, deletedAt: null } }),
      prisma.campaign.count({ where: { status: 'COMPLETED', isTest: false, deletedAt: null } }),
      prisma.clipSubmission.count(),
      prisma.clipSubmission.count({ where: { clipId: { not: null } } }),
      prisma.clipSubmission.count({
        where: {
          clipId: { not: null },
          status: { in: ['APPROVED', 'PENDING'] },
          campaigns: { status: { in: ['ACTIVE', 'COMPLETED'] }, isTest: false, deletedAt: null }
        }
      })
    ])
    console.log(`📊 Tracking eligibility: ${activeCampaignCount} active + ${completedCampaignCount} completed campaigns, ${totalSubmissions} total submissions, ${submissionsWithClipId} with clipId, ${eligibleCount} eligible for tracking`)

    // Get all submissions with clips from ACTIVE and COMPLETED campaigns
    // ACTIVE: track views + earnings, COMPLETED: track views only (for continued reporting)
    const submissions = await prisma.clipSubmission.findMany({
      where: {
        clipId: { not: null },
        status: { in: ['APPROVED', 'PENDING'] },
        campaigns: {
          status: { in: ['ACTIVE', 'COMPLETED'] }, // Track both!
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
          select: { id: true, title: true, status: true, payoutRate: true, budget: true, spent: true, reservedAmount: true }
        }
      }
    })

    // Map and sort by last tracked time (null = never tracked = highest priority)
    // Prioritize ACTIVE campaigns over COMPLETED (active clips need earnings updates)
    const clipsWithTracking = submissions
      .filter(s => s.clips)
      .map(s => {
        // Calculate effective budget (budget - reservedAmount for fees/bounties)
        const totalBudget = Number(s.campaigns.budget)
        const reservedAmount = Number(s.campaigns.reservedAmount || 0)
        const effectiveBudget = totalBudget - reservedAmount
        
        return {
          clipId: s.clipId!,
          url: s.clipUrl,
          platform: s.platform,
          userId: s.userId,
          campaignId: s.campaignId,
          campaignTitle: s.campaigns.title,
          campaignStatus: s.campaigns.status || 'ACTIVE', // Track campaign status for earnings logic
          submissionStatus: s.status,
          submissionId: s.id,
          isApproved: s.status === 'APPROVED',
          initialViews: s.initialViews || BigInt(0),
          lastTracked: s.clips!.view_tracking[0]?.scrapedAt || null,
          payoutRate: Number(s.campaigns.payoutRate),
          campaignBudget: effectiveBudget, // Use effective budget for spending calculations
          campaignSpent: Number(s.campaigns.spent)
        }
      })
      .sort((a, b) => {
        // Priority 1: ACTIVE campaigns before COMPLETED (earnings need updating)
        if (a.campaignStatus === 'ACTIVE' && b.campaignStatus !== 'ACTIVE') return -1
        if (a.campaignStatus !== 'ACTIVE' && b.campaignStatus === 'ACTIVE') return 1
        
        // Priority 2: Never tracked clips first
        if (!a.lastTracked && !b.lastTracked) return 0
        if (!a.lastTracked) return -1
        if (!b.lastTracked) return 1
        
        // Priority 3: Oldest tracked first
        return a.lastTracked.getTime() - b.lastTracked.getTime()
      })

    return clipsWithTracking.slice(0, limit)
  }

  /**
   * Track a single clip - scrape views and update database
   * Includes 60s timeout per clip to fail fast
   * Automatically fixes initialViews = 0 issues
   * 
   * NOTE: For COMPLETED campaigns, we track views but DON'T add earnings
   * This allows continued view tracking for client reporting after campaign ends
   */
  async trackSingleClip(clip: {
    clipId: string
    url: string
    platform: SocialPlatform
    userId: string
    campaignId: string
    campaignStatus: string // 'ACTIVE' or 'COMPLETED'
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
    viewsOnly?: boolean // True if we only tracked views (no earnings - completed campaign)
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

      // 6. Calculate and add earnings (only for approved clips in ACTIVE campaigns)
      // COMPLETED campaigns: views tracked for reporting, but NO earnings added
      let earningsAdded = 0
      const isCompletedCampaign = clip.campaignStatus === 'COMPLETED'
      
      if (clip.isApproved && !isCompletedCampaign) {
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
      } else if (isCompletedCampaign && viewsGained > 0) {
        // For completed campaigns, still update user's totalViews for their stats
        await prisma.user.update({
          where: { id: clip.userId },
          data: { totalViews: { increment: viewsGained } }
        })
      }

      return {
        success: true,
        views: newViews,
        viewsGained,
        earningsAdded,
        initialViewsFixed,
        viewsOnly: isCompletedCampaign
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
      
      // Most scrapes take 5-15s, only stop when we have <20s left
      // (the 60s timeout is a max, not typical duration)
      if (remaining < 20000) { // Need at least 20s for one more clip
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
      const campaignLabel = clip.campaignStatus === 'COMPLETED' ? ' [COMPLETED-views only]' : ''
      
      console.log(`🔍 [${processed + 1}/${clipsToTrack.length}] ${statusLabel} ${clip.platform} clip ${clip.clipId.substring(0, 8)}...${campaignLabel} (last: ${timeSinceLastTrack})`)

      const result = await this.trackSingleClip({
        ...clip,
        campaignStatus: clip.campaignStatus,
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
          : result.viewsOnly 
            ? ' (views only - campaign completed)'
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
