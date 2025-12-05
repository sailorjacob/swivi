import { prisma } from './prisma'
import { XApiClient, createXApiClient, XTweetMetrics } from './x-api-client'
import { MultiPlatformScraper, ScrapedContentData } from './multi-platform-scraper'
import { SocialPlatform } from '@prisma/client'
import { PayoutCalculationService } from './payout-calculation'

interface ViewTrackingUpdate {
  clipId: string
  userId: string
  views: number
  platform: SocialPlatform
  date: Date
}

interface CampaignViewUpdate {
  campaignId: string
  totalViews: number
  totalSpent: number
  utilizationPercentage: number
}

export class XViewTrackingService {
  private xApiClient: XApiClient | null
  private multiPlatformScraper: MultiPlatformScraper | null
  private payoutCalculationService: PayoutCalculationService

  constructor(apifyToken?: string) {
    // Initialize X API client
    this.xApiClient = createXApiClient()
    
    // Initialize multi-platform scraper for non-Twitter platforms
    this.multiPlatformScraper = apifyToken ? new MultiPlatformScraper(apifyToken) : null
    
    // Initialize payout calculation service
    this.payoutCalculationService = new PayoutCalculationService()
  }

  /**
   * Updates view counts for all active campaigns across all platforms
   * Only processes submissions from ACTIVE campaigns
   */
  async updateAllPlatformViews(): Promise<void> {
    try {
      console.log('🚀 Starting view tracking update for active and paused campaigns...')
      
      // Get all ACTIVE and PAUSED campaigns (PAUSED still earns but doesn't accept new submissions)
      // Exclude test and archived campaigns
      const activeCampaigns = await prisma.campaign.findMany({
        where: {
          status: { in: ['ACTIVE', 'PAUSED'] },
          isTest: false,
          deletedAt: null
        },
        select: {
          id: true,
          title: true,
          targetPlatforms: true
        }
      })

      if (activeCampaigns.length === 0) {
        console.log('ℹ️ No active campaigns found. Skipping view tracking update.')
        return
      }

      console.log(`📊 Found ${activeCampaigns.length} active campaigns`)

      // Get unique platforms from active campaigns
      const activePlatforms = new Set<SocialPlatform>()
      activeCampaigns.forEach(campaign => {
        campaign.targetPlatforms.forEach(platform => activePlatforms.add(platform))
      })

      console.log(`🎯 Active platforms: ${Array.from(activePlatforms).join(', ')}`)

      // Update views for each active platform
      for (const platform of activePlatforms) {
        await this.updatePlatformViews(platform, activeCampaigns.map(c => c.id))
      }

      // Update campaign progress and payouts
      await this.updateCampaignProgress(activeCampaigns.map(c => c.id))

      console.log('✅ View tracking update completed for active campaigns')

    } catch (error) {
      console.error('❌ Error in updateAllPlatformViews:', error)
      throw error
    }
  }

  /**
   * Updates view counts for submissions on a specific platform from active campaigns only
   */
  async updatePlatformViews(platform: SocialPlatform, activeCampaignIds: string[]): Promise<void> {
    try {
      console.log(`🔄 Updating ${platform} views for active campaigns...`)

      // Get submissions from active campaigns only
      const submissions = await prisma.clipSubmission.findMany({
        where: {
          platform,
          campaignId: {
            in: activeCampaignIds
          },
          status: {
            in: ['PENDING', 'APPROVED']
          }
        },
        include: {
          campaigns: true,
          clip: true,
          users: true
        }
      })

      console.log(`📝 Found ${submissions.length} ${platform} submissions from active campaigns`)

      if (submissions.length === 0) {
        return
      }

      // Group submissions by URL to avoid duplicate API calls
      const urlGroups = new Map<string, typeof submissions>()
      submissions.forEach(submission => {
        if (!urlGroups.has(submission.clipUrl)) {
          urlGroups.set(submission.clipUrl, [])
        }
        urlGroups.get(submission.clipUrl)!.push(submission)
      })

      console.log(`🔗 Processing ${urlGroups.size} unique URLs for ${platform}`)

      // Process each unique URL
      for (const [url, submissionGroup] of Array.from(urlGroups.entries())) {
        try {
          let viewCount = 0

          if (platform === 'TWITTER' && this.xApiClient) {
            // Use X API for Twitter submissions
            console.log(`🐦 Fetching X/Twitter metrics for: ${url}`)
            const metrics = await this.xApiClient.getTweetMetrics(url)
            
            if (metrics) {
              viewCount = metrics.impressionCount
              console.log(`📊 X/Twitter views: ${viewCount}`)
            } else {
              console.log(`⚠️ Could not fetch X/Twitter metrics for: ${url}`)
              continue
            }

          } else if (this.multiPlatformScraper) {
            // Use Apify for other platforms
            console.log(`🔍 Scraping ${platform} content for: ${url}`)
            const scrapeResult = await this.multiPlatformScraper.scrapeContent(url, platform)

            if (scrapeResult && !scrapeResult.error && scrapeResult.views !== undefined) {
              viewCount = scrapeResult.views
              console.log(`📊 ${platform} views: ${viewCount}`)
            } else {
              console.log(`⚠️ Could not scrape ${platform} data for: ${url}`, scrapeResult?.error)
              continue
            }
          } else {
            console.log(`⚠️ No scraper available for ${platform}`)
            continue
          }

          // Update views for all submissions with this URL
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          for (const submission of submissionGroup) {
            await this.updateSubmissionViews(submission.id, viewCount, today)
          }

          console.log(`✅ Updated ${submissionGroup.length} submissions with ${viewCount} views`)

          // Rate limiting between requests
          if (platform === 'TWITTER') {
            // X API rate limiting (more conservative)
            await new Promise(resolve => setTimeout(resolve, 3000))
          } else {
            // Apify rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000))
          }

        } catch (error) {
          console.error(`❌ Error processing ${platform} URL ${url}:`, error)
          // Continue with other URLs even if one fails
        }
      }

    } catch (error) {
      console.error(`❌ Error updating ${platform} views:`, error)
      throw error
    }
  }

  /**
   * Updates view tracking for a specific submission
   */
  async updateSubmissionViews(
    submissionId: string,
    currentViews: number,
    date: Date
  ): Promise<void> {
    try {
      // Get the submission
      const submission = await prisma.clipSubmission.findUnique({
        where: { id: submissionId },
        include: {
          clip: true,
          users: true,
          campaigns: true
        }
      })

      if (!submission) {
        throw new Error(`Submission not found: ${submissionId}`)
      }

      // Ensure we have a clip record
      let clipId = submission.clipId
      if (!clipId) {
        // Create clip record if it doesn't exist
        const newClip = await prisma.clip.create({
          data: {
            userId: submission.userId,
            url: submission.clipUrl,
            platform: submission.platform,
            views: currentViews,
            status: 'ACTIVE'
          }
        })
        
        // Update submission with clip ID
        await prisma.clipSubmission.update({
          where: { id: submissionId },
          data: { clipId: newClip.id }
        })
        
        clipId = newClip.id
      }

      // Check if we already have tracking data for today
      const existingTracking = await prisma.viewTracking.findUnique({
        where: {
          userId_clipId_date_platform: {
            userId: submission.userId,
            clipId: clipId,
            date: date,
            platform: submission.platform
          }
        }
      })

      if (existingTracking) {
        // Update existing tracking record
        const viewDifference = currentViews - Number(existingTracking.views)

        await prisma.viewTracking.update({
          where: {
            userId_clipId_date_platform: {
              userId: submission.userId,
              clipId: clipId,
              date: date,
              platform: submission.platform
            }
          },
          data: {
            views: currentViews
          }
        })

        // Update user's total views if views increased
        if (viewDifference > 0) {
          await prisma.user.update({
            where: { id: submission.userId },
            data: {
              totalViews: {
                increment: viewDifference
              }
            }
          })

          // Update clip views
          await prisma.clip.update({
            where: { id: clipId },
            data: {
              views: currentViews
            }
          })
        }

        console.log(`📈 Updated tracking for submission ${submissionId}: ${viewDifference} new views`)

      } else {
        // Create new tracking record
        await prisma.viewTracking.create({
          data: {
            userId: submission.userId,
            clipId: clipId,
            views: currentViews,
            date: date,
            platform: submission.platform
          }
        })

        // Update user's total views
        await prisma.user.update({
          where: { id: submission.userId },
          data: {
            totalViews: {
              increment: currentViews
            }
          }
        })

        // Update clip views
        await prisma.clip.update({
          where: { id: clipId },
          data: {
            views: currentViews
          }
        })

        console.log(`📊 Created new tracking for submission ${submissionId}: ${currentViews} views`)
      }

    } catch (error) {
      console.error(`❌ Error updating views for submission ${submissionId}:`, error)
      throw error
    }
  }

  /**
   * Updates campaign progress and calculates payouts for active campaigns
   */
  async updateCampaignProgress(activeCampaignIds: string[]): Promise<CampaignViewUpdate[]> {
    try {
      console.log('📊 Updating campaign progress and calculating payouts...')
      
      const updates: CampaignViewUpdate[] = []

      for (const campaignId of activeCampaignIds) {
        try {
          // Calculate payouts for this campaign
          const payoutResult = await this.payoutCalculationService.calculateCampaignPayouts(campaignId)
          
          // Get campaign stats
          const campaignStats = await this.payoutCalculationService.getCampaignStats(campaignId)
          
          // Update campaign spent amount and status if needed
          if (payoutResult.shouldComplete) {
            await this.payoutCalculationService.updateCampaignBudget(payoutResult)
          } else {
            // Update spent amount even if not completing
            await prisma.campaign.update({
              where: { id: campaignId },
              data: {
                spent: {
                  increment: payoutResult.totalSpent
                }
              }
            })
          }

          const update: CampaignViewUpdate = {
            campaignId,
            totalViews: campaignStats.totalViews,
            totalSpent: campaignStats.totalSpent + payoutResult.totalSpent,
            utilizationPercentage: campaignStats.utilizationPercentage
          }

          updates.push(update)

          console.log(`✅ Updated campaign ${campaignId}: ${update.totalViews} views, $${update.totalSpent} spent (${update.utilizationPercentage.toFixed(1)}%)`)

        } catch (error) {
          console.error(`❌ Error updating campaign ${campaignId}:`, error)
          // Continue with other campaigns
        }
      }

      console.log(`✅ Completed campaign progress updates for ${updates.length} campaigns`)
      return updates

    } catch (error) {
      console.error('❌ Error updating campaign progress:', error)
      throw error
    }
  }

  /**
   * Test X API connection
   */
  async testXApiConnection(): Promise<boolean> {
    if (!this.xApiClient) {
      console.error('❌ X API client not initialized')
      return false
    }

    return await this.xApiClient.testConnection()
  }

  /**
   * Get X API rate limit status
   */
  async getXApiRateLimit(): Promise<any> {
    if (!this.xApiClient) {
      return null
    }

    return await this.xApiClient.getRateLimitStatus()
  }

  /**
   * Gets view statistics for a campaign including real-time data
   */
  async getCampaignViewStats(campaignId: string): Promise<{
    totalViews: number
    totalSubmissions: number
    averageViewsPerSubmission: number
    topPerformingSubmission: {
      url: string
      views: number
      userId: string
      platform: string
    } | null
    platformBreakdown: Array<{
      platform: string
      views: number
      submissions: number
    }>
  }> {
    try {
      const submissions = await prisma.clipSubmission.findMany({
        where: {
          campaignId,
          status: {
            in: ['APPROVED', 'PAID']
          }
        },
        include: {
          clip: {
            include: {
              viewTracking: true
            }
          },
          users: true
        }
      })

      let totalViews = 0
      let topPerformingSubmission = null
      let maxViews = 0
      const platformStats = new Map<string, { views: number; submissions: number }>()

      for (const submission of submissions) {
        const latestTracking = submission.clips?.viewTracking
          ?.sort((a, b) => b.date.getTime() - a.date.getTime())[0]

        const views = latestTracking ? Number(latestTracking.views) : 0
        totalViews += views

        // Track platform stats
        const platform = submission.platform
        if (!platformStats.has(platform)) {
          platformStats.set(platform, { views: 0, submissions: 0 })
        }
        const platformStat = platformStats.get(platform)!
        platformStat.views += views
        platformStat.submissions += 1

        // Track top performing submission
        if (views > maxViews) {
          maxViews = views
          topPerformingSubmission = {
            url: submission.clipUrl,
            views,
            userId: submission.userId,
            platform: submission.platform
          }
        }
      }

      const totalSubmissions = submissions.length
      const averageViewsPerSubmission = totalSubmissions > 0 ? totalViews / totalSubmissions : 0

      const platformBreakdown = Array.from(platformStats.entries()).map(([platform, stats]) => ({
        platform,
        views: stats.views,
        submissions: stats.submissions
      }))

      return {
        totalViews,
        totalSubmissions,
        averageViewsPerSubmission,
        topPerformingSubmission,
        platformBreakdown
      }

    } catch (error) {
      console.error(`❌ Error getting campaign stats for ${campaignId}:`, error)
      throw error
    }
  }
}
