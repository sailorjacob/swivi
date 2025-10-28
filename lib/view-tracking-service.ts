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

      // Create new view tracking record for today
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      await prisma.viewTracking.upsert({
        where: {
          userId_clipId_date_platform: {
            userId: clip.userId,
            clipId,
            date: today,
            platform: clip.platform
          }
        },
        update: {
          views: BigInt(currentViews)
        },
        create: {
          userId: clip.userId,
          clipId,
          views: BigInt(currentViews),
          date: today,
          platform: clip.platform
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
        
        // Calculate total earnings that should exist for this clip
        const totalEarningsShouldBe = (totalViewGrowth / 1000) * payoutRate
        const currentClipEarnings = Number(clip.earnings || 0)
        const earningsDelta = Math.max(0, totalEarningsShouldBe - currentClipEarnings)

        // Budget enforcement - only add earnings if budget allows
        const campaignSpent = Number(campaign.spent || 0)
        const campaignBudget = Number(campaign.budget)
        const remainingBudget = Math.max(0, campaignBudget - campaignSpent)
        earningsToAdd = Math.min(earningsDelta, remainingBudget)
      }

      if (earningsToAdd > 0) {
        const campaignSpent = Number(campaign.spent || 0)
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

          // Update campaign spent
          const campaignBudget = Number(campaign.budget)
          const newSpent = campaignSpent + earningsToAdd
          await tx.campaign.update({
            where: { id: campaign.id },
            data: {
              spent: newSpent
            }
          })

          // Check if campaign should be completed
          if (newSpent >= campaignBudget) {
            await tx.campaign.update({
              where: { id: campaign.id },
              data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                completionReason: `Budget fully utilized ($${campaignBudget.toFixed(2)})`
              }
            })

            // Snapshot final earnings for all submissions in this campaign
            await tx.clipSubmission.updateMany({
              where: {
                campaignId: campaign.id,
                status: 'APPROVED'
              },
              data: {
                finalEarnings: {
                  set: Prisma.sql`(SELECT COALESCE(earnings, 0) FROM clips WHERE clips.id = clip_submissions.clip_id)`
                }
              }
            })

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
   * Tracks views for multiple clips concurrently
   */
  async trackMultipleClips(clipIds: string[]): Promise<TrackingBatchResult> {
    const results = await Promise.allSettled(
      clipIds.map(clipId => this.trackClipViews(clipId))
    )

    const batchResult: TrackingBatchResult = {
      processed: results.length,
      successful: 0,
      failed: 0,
      totalEarningsAdded: 0,
      campaignsCompleted: [],
      errors: []
    }

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          batchResult.successful++
          batchResult.totalEarningsAdded += result.value.earningsAdded || 0
        } else {
          batchResult.failed++
          batchResult.errors.push({
            clipId: clipIds[index],
            error: result.value.error || 'Unknown error'
          })
        }
      } else {
        batchResult.failed++
        batchResult.errors.push({
          clipId: clipIds[index],
          error: result.reason?.message || 'Promise rejection'
        })
      }
    })

    return batchResult
  }

  /**
   * Gets all active clips that need view tracking
   * Tracks ALL submissions in active campaigns (not just approved)
   */
  async getClipsNeedingTracking(limit: number = 100): Promise<Array<{
    id: string
    url: string
    platform: SocialPlatform
    lastTracked?: Date
  }>> {
    // Get clips with ANY submission in active campaigns (track views from submission time)
    const clips = await prisma.clip.findMany({
      where: {
        status: 'ACTIVE',
        clipSubmissions: {
          some: {
            campaigns: {
              status: 'ACTIVE'
            }
          }
        }
      },
      select: {
        id: true,
        url: true,
        platform: true,
        view_tracking: {
          orderBy: { date: 'desc' },
          take: 1,
          select: { date: true }
        }
      },
      take: limit
    })

    return clips.map(clip => ({
      id: clip.id,
      url: clip.url,
      platform: clip.platform,
      lastTracked: clip.view_tracking[0]?.date
    }))
  }

  /**
   * Processes view tracking for all clips that need it (main cron job entry point)
   */
  async processViewTracking(limit: number = 50): Promise<TrackingBatchResult> {
    console.log(`📊 Starting view tracking process for up to ${limit} clips...`)
    
    const clipsNeedingTracking = await this.getClipsNeedingTracking(limit)
    const clipIds = clipsNeedingTracking.map(clip => clip.id)

    console.log(`Found ${clipIds.length} clips to track`)

    if (clipIds.length === 0) {
      return {
        processed: 0,
        successful: 0,
        failed: 0,
        totalEarningsAdded: 0,
        campaignsCompleted: [],
        errors: []
      }
    }

    const result = await this.trackMultipleClips(clipIds)
    
    console.log(`✅ Tracking complete: ${result.successful} successful, ${result.failed} failed, $${result.totalEarningsAdded.toFixed(2)} earnings added`)
    
    return result
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
