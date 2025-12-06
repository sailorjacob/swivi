import { prisma } from '@/lib/prisma'
import { MultiPlatformScraper } from '@/lib/multi-platform-scraper'
import { SocialPlatform, Prisma } from '@prisma/client'

export interface ViewTrackingResult {
  success: boolean
  clipId?: string
  submissionId?: string
  previousViews?: number
  currentViews?: number
  viewsGained?: number
  earningsAdded?: number
  error?: string
}

export interface TrackingBatchResult {
  processed: number
  successful: number
  failed: number
  totalEarningsAdded: number
  campaignsCompleted: string[]
  errors: Array<{ clipId: string; error: string }>
}

/**
 * Unified service for tracking view counts, calculating earnings, and managing campaign budgets
 */
export class ViewTrackingService {
  private scraper: MultiPlatformScraper

  constructor() {
    this.scraper = new MultiPlatformScraper(process.env.APIFY_API_KEY || '')
  }

  /**
   * Tracks views for a single clip and calculates earnings with budget enforcement
   */
  async trackClipViews(clipId: string): Promise<ViewTrackingResult> {
    try {
      // Get clip with all necessary relations
      const clip = await prisma.clip.findUnique({
        where: { id: clipId },
        include: {
          clipSubmissions: {
            include: {
              campaigns: {
        select: {
          id: true,
                  payoutRate: true,
                  budget: true,
                  spent: true,
                  status: true
                }
              }
            }
          },
          view_tracking: {
            orderBy: { date: 'desc' },
            take: 1,
            select: { views: true, date: true }
          }
        }
      })

      if (!clip) {
        return {
          success: false,
          error: 'Clip not found'
        }
      }

      // Get any submission in an active campaign (track views from submission, not just approval)
      const activeSubmission = clip.clipSubmissions.find(s => 
        s.campaigns.status === 'ACTIVE'
      )
      
      if (!activeSubmission) {
        return {
          success: false,
          error: 'No active campaign submission found for clip'
        }
      }

      const campaign = activeSubmission.campaigns
      const isApproved = activeSubmission.status === 'APPROVED'

      // Scrape current view count
      const scrapedData = await this.scraper.scrapeContent(clip.url, clip.platform)

      if (scrapedData.error) {
        return {
          success: false,
          clipId,
          error: `Failed to scrape views: ${scrapedData.error}`
        }
      }

      const currentViews = scrapedData.views || 0
      const latestTracking = clip.view_tracking[0]
      const previousViews = latestTracking ? Number(latestTracking.views) : 0
      const viewsGained = Math.max(0, currentViews - previousViews)

      // Update clip's total views
        await prisma.clip.update({
          where: { id: clipId },
          data: {
            views: BigInt(currentViews),
            likes: BigInt(scrapedData.likes || 0),
            shares: BigInt(scrapedData.shares || 0)
          }
        })

      // Create a NEW view tracking record for each scrape
      // This gives complete tracking history instead of just 1 record per day
      const now = new Date()
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      await prisma.viewTracking.create({
        data: {
          userId: clip.userId,
          clipId,
          views: BigInt(currentViews),
          date: today,
          platform: clip.platform,
          scrapedAt: now
        }
      })

      // Only calculate earnings for APPROVED submissions
      let earningsToAdd = 0
      let campaignCompleted = false

      if (isApproved) {
        // Calculate earnings from view growth
        const initialViews = Number(activeSubmission.initialViews || 0)
        const totalViewGrowth = currentViews - initialViews
        const payoutRate = Number(campaign.payoutRate)
        const campaignBudget = Number(campaign.budget)
        
        // Calculate total earnings that should exist for this clip
        const totalEarningsShouldBe = (totalViewGrowth / 1000) * payoutRate
        
        // Per-clip cap: maximum 30% of campaign budget per single clip
        const maxClipEarnings = campaignBudget * 0.30
        const cappedEarnings = Math.min(totalEarningsShouldBe, maxClipEarnings)
        
        const currentClipEarnings = Number(clip.earnings || 0)
        const earningsDelta = Math.max(0, cappedEarnings - currentClipEarnings)

        // Budget enforcement - only add earnings if budget allows
        const campaignSpent = Number(campaign.spent || 0)
        const remainingBudget = Math.max(0, campaignBudget - campaignSpent)
        earningsToAdd = Math.min(earningsDelta, remainingBudget)
      }

      if (earningsToAdd > 0) {
        // Update everything in a transaction
        await prisma.$transaction(async (tx) => {
          // Update clip earnings
          await tx.clip.update({
            where: { id: clipId },
            data: {
              earnings: {
                increment: earningsToAdd
              }
            }
          })

          // Update user total earnings
          await tx.user.update({
            where: { id: clip.userId },
            data: {
              totalEarnings: {
                increment: earningsToAdd
              },
              totalViews: {
                increment: viewsGained
              }
            }
          })

          // Recalculate campaign spent from actual clip earnings (prevents drift)
          const actualSpent = await tx.clipSubmission.findMany({
            where: {
              campaignId: campaign.id,
              status: 'APPROVED',
              clipId: { not: null }
            },
            include: {
              clips: {
                select: { earnings: true }
              }
            }
          })

          const totalSpent = actualSpent.reduce((sum, sub) => {
            return sum + Number(sub.clips?.earnings || 0)
          }, 0)

          // Update campaign spent to actual total
          const campaignBudget = Number(campaign.budget)
          await tx.campaign.update({
            where: { id: campaign.id },
            data: {
              spent: totalSpent
            }
          })

          // Check if campaign should be completed
          if (totalSpent >= campaignBudget) {
            await tx.campaign.update({
              where: { id: campaign.id },
              data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                completionReason: `Budget fully utilized ($${campaignBudget.toFixed(2)})`
              }
            })

            // Snapshot final earnings for all approved submissions in this campaign
            const approvedSubmissions = await tx.clipSubmission.findMany({
              where: {
                campaignId: campaign.id,
                status: 'APPROVED',
                clipId: { not: null }
              },
              include: {
                clips: {  // Fixed: was 'clip', should be 'clips' (relation name)
                  select: { earnings: true }
                }
              }
            })

            // Update each submission with its clip's final earnings
            console.log(`📸 Snapshotting finalEarnings for ${approvedSubmissions.length} submissions in campaign ${campaign.id}`)
            for (const submission of approvedSubmissions) {
              const earnings = Number(submission.clips?.earnings || 0)
              await tx.clipSubmission.update({
                where: { id: submission.id },
                data: {
                  finalEarnings: earnings
                }
              })
              console.log(`   Submission ${submission.id}: $${earnings.toFixed(2)}`)
            }

            campaignCompleted = true
          }
        })

        // Send notifications if campaign completed
        if (campaignCompleted) {
          await this.notifyCampaignCompletion(campaign.id)
        }
      }

      return {
        success: true,
        clipId,
        submissionId: activeSubmission.id,
        previousViews,
        currentViews,
        viewsGained,
        earningsAdded: earningsToAdd
      }

    } catch (error) {
      console.error(`Error tracking views for clip ${clipId}:`, error)
      return {
        success: false,
        clipId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Tracks views for multiple clips in controlled batches
   * Prevents overwhelming Apify API and respects rate limits
   */
  async trackMultipleClips(
    clipIds: string[], 
    batchSize: number = 5  // Reduced to avoid overwhelming Apify
  ): Promise<TrackingBatchResult> {
    const results: ViewTrackingResult[] = []
    
    // Process in smaller batches to avoid overwhelming Apify
    for (let i = 0; i < clipIds.length; i += batchSize) {
      const batch = clipIds.slice(i, i + batchSize)
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(clipIds.length / batchSize)} (${batch.length} clips)`)
      
      const batchResults = await Promise.allSettled(
        batch.map(clipId => this.trackClipViews(clipId))
      )
      
      // Collect results
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        }
      })
      
      // Longer delay between batches to let Apify complete previous runs
      if (i + batchSize < clipIds.length) {
        console.log(`⏸️  Pausing 5s before next batch...`)
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }
    
    // Convert to Promise.allSettled format for compatibility
    const settledResults = results.map(r => ({ status: 'fulfilled' as const, value: r }))

    const batchResult: TrackingBatchResult = {
      processed: settledResults.length,
      successful: 0,
      failed: 0,
      totalEarningsAdded: 0,
      campaignsCompleted: [],
      errors: []
    }

    settledResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          batchResult.successful++
          batchResult.totalEarningsAdded += result.value.earningsAdded || 0
        } else {
          batchResult.failed++
          batchResult.errors.push({
            clipId: result.value.clipId || 'unknown',
            error: result.value.error || 'Unknown error'
          })
        }
      } else {
        batchResult.failed++
        batchResult.errors.push({
          clipId: 'unknown',
          error: result.reason?.message || 'Promise rejection'
        })
      }
    })

    return batchResult
  }

  /**
   * Gets all active clips that need view tracking, grouped by campaign for fairness
   * CRITICAL: All clips in a campaign are tracked together to ensure fair competition
   * 
   * Now also tracks COMPLETED campaigns for analytics (views only, no earnings)
   * Similar to Whop analytics - continue monitoring performance after budget exhaustion
   */
  async getClipsNeedingTracking(limit: number = 100): Promise<Array<{
    id: string
    url: string
    platform: SocialPlatform
    lastTracked?: Date
    campaignId: string
    isApproved?: boolean
  }>> {
    // Get campaigns that need view tracking:
    // - ACTIVE/PAUSED: Full tracking with earnings calculation
    // - COMPLETED: Analytics only (track views, no earnings added)
    // Exclude test and deleted campaigns from view tracking
    const activeCampaigns = await prisma.campaign.findMany({
      where: {
        status: { in: ['ACTIVE', 'PAUSED', 'COMPLETED'] },
        isTest: false, // Don't track test campaigns
        deletedAt: null, // Don't track archived campaigns
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        spent: true,
        budget: true,
        clipSubmissions: {
          where: {
            // Track ALL submissions with clips (not just approved)
            // This gives admins visibility into pending clips' performance
            // Earnings are only calculated for APPROVED clips (see trackClipViews)
            clipId: { not: null }
          },
          select: {
            clipId: true,
            status: true, // Include status to know if approved
            clips: {
              select: {
                id: true,
                url: true,
                platform: true,
                status: true,
                view_tracking: {
                  orderBy: { scrapedAt: 'desc' },
                  take: 1,
                  select: { scrapedAt: true }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' } // Prioritize newer campaigns
    })

    // Calculate campaign priority scores
    interface CampaignWithPriority {
      campaignId: string
      campaignName: string
      campaignStatus: string | null
      clips: Array<{
        id: string
        url: string
        platform: SocialPlatform
        lastTracked?: Date
        campaignId: string
        isApproved?: boolean
      }>
      priority: number
      budgetRemaining: number
    }

    const campaignsWithClips: CampaignWithPriority[] = activeCampaigns
      .map(campaign => {
        // Include all clips (ACTIVE and PENDING status) for tracking
        // This ensures pending submissions are also tracked for admin visibility
        const clips = campaign.clipSubmissions
          .filter(sub => sub.clips && (sub.clips.status === 'ACTIVE' || sub.clips.status === 'PENDING'))
          .map(sub => ({
            id: sub.clips!.id,
            url: sub.clips!.url,
            platform: sub.clips!.platform,
            lastTracked: sub.clips!.view_tracking[0]?.scrapedAt,
            campaignId: campaign.id,
            isApproved: sub.status === 'APPROVED' // Track approval status for earnings calc
          }))

        if (clips.length === 0) return null

        // Calculate campaign priority based on oldest untracked clip
        const oldestTracking = clips
          .map(c => c.lastTracked?.getTime() || 0)
          .sort((a, b) => a - b)[0]
        
        const hoursSinceOldest = oldestTracking 
          ? (Date.now() - oldestTracking) / (1000 * 60 * 60)
          : 999 // Never tracked = highest priority
        
        // Boost priority for new campaigns
        const campaignAgeDays = (Date.now() - campaign.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        let priority = hoursSinceOldest
        if (campaignAgeDays < 7) {
          priority *= 1.5
        }
        
        // Deprioritize COMPLETED campaigns (analytics only, not earning)
        // Track less frequently to save API costs
        const isCompleted = campaign.status === 'COMPLETED'
        if (isCompleted) {
          priority *= 0.3 // Lower priority for completed campaigns
        }

        return {
          campaignId: campaign.id,
          campaignName: campaign.title,
          campaignStatus: campaign.status,
          clips,
          priority,
          budgetRemaining: Number(campaign.budget) - Number(campaign.spent || 0)
        }
      })
      .filter((c): c is CampaignWithPriority => c !== null)

    // Sort campaigns by priority
    campaignsWithClips.sort((a, b) => b.priority - a.priority)

    // Collect clips by campaign until we hit the limit
    // CRITICAL: Include ALL clips from a campaign or NONE (fairness)
    // SPECIAL: For large campaigns (> limit), process them alone with increased capacity
    const selectedClips: Array<{
      id: string
      url: string
      platform: SocialPlatform
      lastTracked?: Date
      campaignId: string
    }> = []
    
    for (const campaign of campaignsWithClips) {
      const campaignSize = campaign.clips.length
      
      // Case 1: Large campaign (> limit) - process it ALONE in this run
      if (campaignSize > limit) {
        if (selectedClips.length === 0) {
          // This is the first campaign, include it even though it exceeds limit
          selectedClips.push(...campaign.clips)
          console.log(`🎯 Large campaign "${campaign.campaignName}" (${campaignSize} clips) - processing alone this run`)
          console.log(`⚠️  This may take longer than normal (${Math.ceil(campaignSize / 10)} batches)`)
          break // Process only this campaign
        } else {
          // We already have some clips, skip this large campaign for next run
          console.log(`⏭️  Skipping large campaign "${campaign.campaignName}" (${campaignSize} clips) - will process in next run`)
          break
        }
      }
      
      // Case 2: Normal campaign - add if it fits
      if (selectedClips.length + campaignSize <= limit) {
        selectedClips.push(...campaign.clips)
        const statusNote = campaign.campaignStatus === 'COMPLETED' ? ' [analytics only]' : ''
        console.log(`📦 Including campaign "${campaign.campaignName}" (${campaignSize} clips, $${campaign.budgetRemaining.toFixed(2)} remaining)${statusNote}`)
      } else {
        // Would exceed limit, stop here
        console.log(`⏸️  Stopping at ${selectedClips.length} clips (adding "${campaign.campaignName}" would exceed ${limit} limit)`)
        break
      }
    }

    const neverTrackedCount = selectedClips.filter(c => !c.lastTracked).length
    const staleCount = selectedClips.filter(c => {
      if (!c.lastTracked) return false
      const hours = (Date.now() - c.lastTracked.getTime()) / (1000 * 60 * 60)
      return hours > 8
    }).length
    
    console.log(`📊 Selected ${selectedClips.length} clips from ${new Set(selectedClips.map(c => c.campaignId)).size} campaigns (${neverTrackedCount} never tracked, ${staleCount} stale)`)
    
    return selectedClips
  }

  /**
   * Processes view tracking for all clips that need it (main cron job entry point)
   * Uses campaign-grouped batched processing for fairness and rate limit compliance
   * CRITICAL: All clips from the same campaign are tracked together in the same run
   */
  async processViewTracking(
    limit: number = 100, 
    batchSize: number = 5  // Smaller batches for better Apify completion rate
  ): Promise<TrackingBatchResult> {
    console.log(`📊 Starting view tracking process for up to ${limit} clips (batches of ${batchSize})...`)
    console.log(`⚖️  Fair tracking mode: All clips from a campaign tracked together`)
    
    const clipsNeedingTracking = await this.getClipsNeedingTracking(limit)

    if (clipsNeedingTracking.length === 0) {
      console.log(`✨ No clips need tracking at this time`)
      return {
        processed: 0,
        successful: 0,
        failed: 0,
        totalEarningsAdded: 0,
        campaignsCompleted: [],
        errors: []
      }
    }

    // Group clips by campaign for organized tracking
    const clipsByCampaign = new Map<string, string[]>()
    clipsNeedingTracking.forEach(clip => {
      const existing = clipsByCampaign.get(clip.campaignId) || []
      existing.push(clip.id)
      clipsByCampaign.set(clip.campaignId, existing)
    })

    console.log(`🎯 Tracking ${clipsNeedingTracking.length} clips across ${clipsByCampaign.size} campaigns`)
    
    // Track all clips (they're already grouped fairly by campaign)
    const clipIds = clipsNeedingTracking.map(clip => clip.id)
    const result = await this.trackMultipleClips(clipIds, batchSize)
    
    const successRate = ((result.successful / result.processed) * 100).toFixed(1)
    console.log(`✅ Tracking complete: ${result.successful}/${result.processed} successful (${successRate}%), $${result.totalEarningsAdded.toFixed(2)} earnings added`)
    
    if (result.failed > 0) {
      console.warn(`⚠️  ${result.failed} clips failed to track. First 5 errors:`, result.errors.slice(0, 5))
    }
    
    // Show per-campaign summary
    clipsByCampaign.forEach((clipIds, campaignId) => {
      const campaignSuccessful = clipIds.filter(id => 
        result.errors.every(e => e.clipId !== id)
      ).length
      console.log(`  📋 Campaign ${campaignId}: ${campaignSuccessful}/${clipIds.length} clips tracked`)
    })
    
    return result
  }

  /**
   * Tracks views for PENDING submissions (pre-approval analytics)
   * This allows admins to see view growth before approving a submission
   * NOTE: This does NOT calculate earnings - only updates view counts for visibility
   */
  async trackPendingSubmissions(limit: number = 20): Promise<{
    processed: number
    successful: number
    failed: number
  }> {
    console.log(`📊 Tracking pending submissions for pre-approval analytics...`)
    
    // Get pending submissions from active campaigns that don't have clips yet
    const pendingSubmissions = await prisma.clipSubmission.findMany({
      where: {
        status: 'PENDING',
        clipId: null, // Only submissions without clips (not yet approved)
        campaigns: {
          status: 'ACTIVE',
          isTest: false,
          deletedAt: null
        }
      },
      select: {
        id: true,
        clipUrl: true,
        platform: true,
        initialViews: true,
        users: {
          select: { id: true, name: true }
        },
        campaigns: {
          select: { title: true }
        }
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    if (pendingSubmissions.length === 0) {
      console.log(`✨ No pending submissions to track`)
      return { processed: 0, successful: 0, failed: 0 }
    }

    console.log(`🔍 Found ${pendingSubmissions.length} pending submissions to track`)

    let successful = 0
    let failed = 0

    // Process each pending submission
    for (const submission of pendingSubmissions) {
      try {
        // Scrape current views
        const scrapedData = await this.scraper.scrapeContent(submission.clipUrl, submission.platform)
        
        if (scrapedData.error || !scrapedData.views) {
          console.log(`⚠️  Could not scrape views for pending submission ${submission.id}: ${scrapedData.error || 'no views returned'}`)
          failed++
          continue
        }

        const currentViews = scrapedData.views
        const previousViews = Number(submission.initialViews || 0)
        const viewGrowth = currentViews - previousViews

        // Update the submission with the latest scraped views
        // We store this in initialViews since it represents the current state
        // When approved, initialViews becomes the baseline for earnings
        await prisma.clipSubmission.update({
          where: { id: submission.id },
          data: {
            initialViews: BigInt(currentViews)
          }
        })

        console.log(`✅ Pending "${submission.campaigns.title}" by ${submission.users.name || 'Unknown'}: ${currentViews.toLocaleString()} views (+${viewGrowth.toLocaleString()} growth)`)
        successful++

        // Small delay to avoid overwhelming Apify
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`❌ Error tracking pending submission ${submission.id}:`, error)
        failed++
      }
    }

    console.log(`✅ Pending tracking complete: ${successful}/${pendingSubmissions.length} successful`)
    return { processed: pendingSubmissions.length, successful, failed }
  }

  /**
   * Gets view tracking statistics for a clip
   */
  async getClipViewStats(clipId: string): Promise<{
    totalViews: number
    viewsToday: number
    viewsYesterday: number
    viewsThisWeek: number
    averageDailyViews: number
    daysTracked: number
    currentEarnings: number
    projectedFinalEarnings: number
  } | null> {
    try {
      const clip = await prisma.clip.findUnique({
        where: { id: clipId },
        include: {
          view_tracking: {
            orderBy: { date: 'desc' }
          },
          clipSubmissions: {
            include: {
              campaigns: {
                select: {
                  payoutRate: true,
                  budget: true,
                  spent: true
                }
              }
            }
          }
        }
      })

      if (!clip || clip.view_tracking.length === 0) {
        return null
      }

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)

      let viewsToday = 0
      let viewsYesterday = 0
      let viewsThisWeek = 0

      for (const tracking of clip.view_tracking) {
        const trackingDate = tracking.date.getTime()

        if (trackingDate === today.getTime()) {
          viewsToday = Number(tracking.views)
        } else if (trackingDate === yesterday.getTime()) {
          viewsYesterday = Number(tracking.views)
        }

        if (tracking.date >= weekAgo) {
          viewsThisWeek += Number(tracking.views)
        }
      }

      const totalViews = Number(clip.views || 0)
      const daysTracked = clip.view_tracking.length
      const averageDailyViews = daysTracked > 0 ? totalViews / daysTracked : 0
      const currentEarnings = Number(clip.earnings || 0)

      // Project final earnings based on current view growth rate
      const activeSubmission = clip.clipSubmissions.find(s => s.status === 'APPROVED')
      const campaign = activeSubmission?.campaigns
      let projectedFinalEarnings = currentEarnings

      if (campaign && daysTracked > 1) {
        const payoutRate = Number(campaign.payoutRate)
        const remainingBudget = Number(campaign.budget) - Number(campaign.spent || 0)
        projectedFinalEarnings = Math.min(currentEarnings + remainingBudget, currentEarnings * 2)
      }

      return {
        totalViews,
        viewsToday,
        viewsYesterday,
        viewsThisWeek,
        averageDailyViews,
        daysTracked,
        currentEarnings,
        projectedFinalEarnings
      }

    } catch (error) {
      console.error(`Error getting view stats for clip ${clipId}:`, error)
      return null
    }
  }

  /**
   * Notify all clippers when a campaign completes
   */
  private async notifyCampaignCompletion(campaignId: string): Promise<void> {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { title: true, completionReason: true }
      })

      if (!campaign) return

      // Get all users who have approved submissions in this campaign
      const submissions = await prisma.clipSubmission.findMany({
        where: {
          campaignId,
          status: 'APPROVED'
        },
        select: {
          userId: true,
          users: {
            select: { id: true }
          }
        },
        distinct: ['userId']
      })

      // Send notifications
      for (const submission of submissions) {
        await prisma.notification.create({
          data: {
            userId: submission.userId,
            type: 'CAMPAIGN_COMPLETED',
            title: 'Campaign Completed! 🎉',
            message: `"${campaign.title}" has reached its budget and is now complete. You can now request a payout for your earnings.`,
            data: {
              campaignId,
              campaignTitle: campaign.title,
              reason: campaign.completionReason
            }
          }
        })
      }

      console.log(`📢 Notified ${submissions.length} clippers about campaign completion`)
    } catch (error) {
      console.error('Error notifying campaign completion:', error)
    }
  }

  /**
   * Get campaign view and earnings statistics
   */
  async getCampaignViewStats(campaignId: string): Promise<{
    totalViews: number
    totalSubmissions: number
    averageViewsPerSubmission: number
    totalEarnings: number
    budgetUtilization: number
    topPerformers: Array<{
      userId: string
      userName: string
      views: number
      earnings: number
    }>
  }> {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: {
          budget: true,
          spent: true,
          clipSubmissions: {
            where: {
              status: { in: ['APPROVED', 'PAID'] }
            },
            include: {
              clips: {
                select: {
                  views: true,
                  earnings: true
                }
              },
              users: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      })

      if (!campaign) {
        throw new Error('Campaign not found')
      }

      const totalViews = campaign.clipSubmissions.reduce((sum, sub) => {
        return sum + Number(sub.clips?.views || 0)
      }, 0)

      const totalSubmissions = campaign.clipSubmissions.length
      const averageViewsPerSubmission = totalSubmissions > 0 ? totalViews / totalSubmissions : 0
      const totalEarnings = Number(campaign.spent || 0)
      const budgetUtilization = (totalEarnings / Number(campaign.budget)) * 100

      // Get top performers
      const performers = campaign.clipSubmissions
        .map(sub => ({
          userId: sub.userId,
          userName: sub.users.name || 'Unknown',
          views: Number(sub.clips?.views || 0),
          earnings: Number(sub.clips?.earnings || 0)
        }))
        .sort((a, b) => b.earnings - a.earnings)
        .slice(0, 10)

      return {
        totalViews,
        totalSubmissions,
        averageViewsPerSubmission,
        totalEarnings,
        budgetUtilization,
        topPerformers: performers
      }

    } catch (error) {
      console.error(`Error getting campaign stats for ${campaignId}:`, error)
      throw error
    }
  }
}
