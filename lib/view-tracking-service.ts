import { prisma } from '@/lib/prisma'
import { MultiPlatformScraper } from '@/lib/multi-platform-scraper'
import { SocialPlatform } from '@prisma/client'

export interface ViewTrackingResult {
  success: boolean
  clipId?: string
  previousViews?: number
  currentViews?: number
  viewsGained?: number
  error?: string
}

export interface TrackingBatchResult {
  processed: number
  successful: number
  failed: number
  errors: Array<{ clipId: string; error: string }>
}

/**
 * Service for tracking view counts on clips and calculating earnings
 */
export class ViewTrackingService {
  private scraper: MultiPlatformScraper

  constructor() {
    this.scraper = new MultiPlatformScraper(process.env.APIFY_TOKEN || '')
  }

  /**
   * Tracks views for a single clip and updates the database
   */
  async trackClipViews(clipId: string): Promise<ViewTrackingResult> {
    try {
      // Get clip details
      const clip = await prisma.clip.findUnique({
        where: { id: clipId },
        select: {
          id: true,
          url: true,
          platform: true,
          views: true,
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

      // Get latest view tracking record
      const latestTracking = clip.view_tracking[0]
      const previousViews = latestTracking ? Number(latestTracking.views) : 0

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
      const viewsGained = currentViews - previousViews

      // Update clip's total views if this is higher
      if (currentViews > Number(clip.views)) {
        await prisma.clip.update({
          where: { id: clipId },
          data: {
            views: BigInt(currentViews),
            likes: BigInt(scrapedData.likes || 0),
            shares: BigInt(scrapedData.shares || 0)
          }
        })
      }

      // Create new view tracking record for today
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Check if we already have a record for today
      const existingToday = await prisma.viewTracking.findUnique({
        where: {
          userId_clipId_date_platform: {
            userId: clip.userId,
            clipId,
            date: today,
            platform: clip.platform
          }
        }
      })

      if (existingToday) {
        // Update existing record if views have increased
        if (currentViews > Number(existingToday.views)) {
          await prisma.viewTracking.update({
            where: { id: existingToday.id },
            data: { views: BigInt(currentViews) }
          })
        }
      } else {
        // Create new record
        await prisma.viewTracking.create({
          data: {
            userId: clip.userId,
            clipId,
            views: BigInt(currentViews),
            date: today,
            platform: clip.platform
          }
        })
      }

      return {
        success: true,
        clipId,
        previousViews,
        currentViews,
        viewsGained
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
      errors: []
    }

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          batchResult.successful++
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
   */
  async getClipsNeedingTracking(limit: number = 100): Promise<Array<{
    id: string
    url: string
    platform: SocialPlatform
    lastTracked?: Date
  }>> {
    // Get clips that haven't been tracked today or need updating
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const clips = await prisma.clip.findMany({
      where: {
        status: 'ACTIVE',
        // Only include clips created in the last 30 days to avoid tracking old content
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
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
   * Processes view tracking for all clips that need it
   */
  async processViewTracking(limit: number = 50): Promise<TrackingBatchResult> {
    const clipsNeedingTracking = await this.getClipsNeedingTracking(limit)
    const clipIds = clipsNeedingTracking.map(clip => clip.id)

    if (clipIds.length === 0) {
      return {
        processed: 0,
        successful: 0,
        failed: 0,
        errors: []
      }
    }

    return await this.trackMultipleClips(clipIds)
  }

  /**
   * Calculates earnings for a clip based on view growth and campaign payout rate
   */
  async calculateClipEarnings(clipId: string): Promise<{
    success: boolean
    earnings?: number
    viewsGained?: number
    error?: string
  }> {
    try {
      const clip = await prisma.clip.findUnique({
        where: { id: clipId },
        include: {
          clipSubmissions: {
            include: {
              campaigns: {
                select: { payoutRate: true }
              }
            }
          },
          view_tracking: {
            orderBy: { date: 'desc' },
            take: 2 // Get last 2 records to calculate growth
          }
        }
      })

      if (!clip) {
        return { success: false, error: 'Clip not found' }
      }

      if (clip.view_tracking.length < 2) {
        return { success: false, error: 'Insufficient view tracking data' }
      }

      const latest = clip.view_tracking[0]
      const previous = clip.view_tracking[1]

      const viewsGained = Number(latest.views) - Number(previous.views)
      const payoutRate = clip.clipSubmissions[0]?.campaigns.payoutRate || 0

      // Calculate earnings based on views per 1K views rate
      const earnings = (viewsGained / 1000) * Number(payoutRate)

      // Update clip earnings if positive
      if (earnings > 0) {
        await prisma.clip.update({
          where: { id: clipId },
          data: {
            earnings: {
              increment: earnings
            }
          }
        })

        // Update user's total earnings
        await prisma.user.update({
          where: { id: clip.userId },
          data: {
            totalEarnings: {
              increment: earnings
            }
          }
        })
      }

      return {
        success: true,
        earnings,
        viewsGained
      }

    } catch (error) {
      console.error(`Error calculating earnings for clip ${clipId}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
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
  } | null> {
    try {
      const clip = await prisma.clip.findUnique({
        where: { id: clipId },
        include: {
          view_tracking: {
            orderBy: { date: 'desc' }
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
      let totalViews = 0

      for (const tracking of clip.view_tracking) {
        totalViews += Number(tracking.views)

        if (tracking.date.getTime() === today.getTime()) {
          viewsToday = Number(tracking.views)
        } else if (tracking.date.getTime() === yesterday.getTime()) {
          viewsYesterday = Number(tracking.views)
        }

        if (tracking.date >= weekAgo) {
          viewsThisWeek += Number(tracking.views)
        }
      }

      const daysTracked = clip.view_tracking.length
      const averageDailyViews = daysTracked > 0 ? totalViews / daysTracked : 0

      return {
        totalViews,
        viewsToday,
        viewsYesterday,
        viewsThisWeek,
        averageDailyViews,
        daysTracked
      }

    } catch (error) {
      console.error(`Error getting view stats for clip ${clipId}:`, error)
      return null
    }
  }
}
