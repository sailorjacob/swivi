import { prisma } from './prisma'
import { MultiPlatformScraper, ScrapedContentData } from './multi-platform-scraper'
import { SocialPlatform } from '@prisma/client'

interface ViewTrackingUpdate {
  clipId: string
  userId: string
  views: number
  platform: SocialPlatform
  date: Date
}

export class ViewTrackingService {
  private multiPlatformScraper: MultiPlatformScraper

  constructor(apifyToken: string) {
    this.multiPlatformScraper = new MultiPlatformScraper(apifyToken)
  }

  /**
   * Updates view counts for all active submissions across all platforms
   */
  async updateAllPlatformViews(): Promise<void> {
    try {
      const supportedPlatforms = this.multiPlatformScraper.getSupportedPlatforms()

      for (const platform of supportedPlatforms) {
        await this.updatePlatformViews(platform)
      }

    } catch (error) {
      console.error('Error in updateAllPlatformViews:', error)
      throw error
    }
  }

  /**
   * Updates view counts for all active submissions on a specific platform
   */
  async updatePlatformViews(platform: SocialPlatform): Promise<void> {
    try {
      // Get all pending/approved submissions for this platform
      const submissions = await prisma.clipSubmission.findMany({
        where: {
          platform,
          status: {
            in: ['PENDING', 'APPROVED']
          }
        },
        include: {
          campaign: true,
          clip: true,
          user: true
        }
      })

      console.log(`Found ${submissions.length} ${platform} submissions to track`)

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

      // Process each unique URL
      for (const [url, submissionGroup] of Array.from(urlGroups.entries())) {
        try {
          console.log(`Scraping ${platform} content for: ${url}`)
          const scrapeResult = await this.multiPlatformScraper.scrapeContent(url, platform)

          if (scrapeResult && !scrapeResult.error && scrapeResult.views !== undefined) {
            const currentViews = scrapeResult.views
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            // Update views for all submissions with this URL
            for (const submission of submissionGroup) {
              await this.updateSubmissionViews(submission.id, currentViews, today)
            }

            console.log(`Updated ${submissionGroup.length} submissions with ${currentViews} views`)
          } else {
            console.log(`No valid data returned for URL: ${url}`, scrapeResult?.error)
          }

          // Rate limiting: wait 1 second between requests
          await new Promise(resolve => setTimeout(resolve, 1000))

        } catch (error) {
          console.error(`Error processing ${platform} URL ${url}:`, error)
          // Continue with other URLs even if one fails
        }
      }

    } catch (error) {
      console.error(`Error updating ${platform} views:`, error)
      throw error
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async updateAllTikTokViews(): Promise<void> {
    return this.updatePlatformViews('TIKTOK')
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
          user: true
        }
      })

      if (!submission) {
        throw new Error(`Submission not found: ${submissionId}`)
      }

      // Check if we already have tracking data for today
      const existingTracking = await prisma.viewTracking.findUnique({
        where: {
          userId_clipId_date_platform: {
            userId: submission.userId,
            clipId: submission.clipId || '',
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
              clipId: submission.clipId || '',
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

          // Update clip views if it exists
          if (submission.clip) {
            await prisma.clip.update({
              where: { id: submission.clip.id },
              data: {
                views: currentViews
              }
            })
          }
        }

        console.log(`Updated tracking for submission ${submissionId}: ${viewDifference} new views`)

      } else {
        // Create new tracking record
        await prisma.viewTracking.create({
          data: {
            userId: submission.userId,
            clipId: submission.clipId || '',
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

        // Update clip views if it exists
        if (submission.clip) {
          await prisma.clip.update({
            where: { id: submission.clip.id },
            data: {
              views: currentViews
            }
          })
        }

        console.log(`Created new tracking for submission ${submissionId}: ${currentViews} views`)
      }

    } catch (error) {
      console.error(`Error updating views for submission ${submissionId}:`, error)
      throw error
    }
  }

  /**
   * Gets view statistics for a campaign
   */
  async getCampaignViewStats(campaignId: string): Promise<{
    totalViews: number
    totalSubmissions: number
    averageViewsPerSubmission: number
    topPerformingSubmission: {
      url: string
      views: number
      userId: string
    } | null
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
          }
        }
      })

      const totalViews = submissions.reduce((sum, submission) => {
        const latestTracking = submission.clip?.viewTracking
          .sort((a, b) => b.date.getTime() - a.date.getTime())[0]
        return sum + Number(latestTracking?.views || 0)
      }, 0)

      const totalSubmissions = submissions.length

      const averageViewsPerSubmission = totalSubmissions > 0
        ? totalViews / totalSubmissions
        : 0

      // Find top performing submission
      let topPerformingSubmission = null
      let maxViews = 0

      for (const submission of submissions) {
        const latestTracking = submission.clip?.viewTracking
          ?.sort((a, b) => b.date.getTime() - a.date.getTime())[0]

        if (latestTracking && Number(latestTracking.views) > maxViews) {
          maxViews = Number(latestTracking.views)
          topPerformingSubmission = {
            url: submission.clipUrl,
            views: Number(latestTracking.views),
            userId: submission.userId
          }
        }
      }

      return {
        totalViews,
        totalSubmissions,
        averageViewsPerSubmission,
        topPerformingSubmission
      }

    } catch (error) {
      console.error(`Error getting campaign stats for ${campaignId}:`, error)
      throw error
    }
  }

  /**
   * Gets view statistics for a user across all campaigns
   */
  async getUserViewStats(userId: string): Promise<{
    totalViews: number
    totalEarnings: number
    activeSubmissions: number
    campaignsParticipated: number
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          submissions: {
            where: {
              status: {
                in: ['APPROVED', 'PAID']
              }
            },
            include: {
              campaign: true,
              clip: {
                include: {
                  viewTracking: true
                }
              }
            }
          }
        }
      })

      if (!user) {
        throw new Error(`User not found: ${userId}`)
      }

      const totalViews = Number(user.totalViews)
      const totalEarnings = Number(user.totalEarnings)
      const activeSubmissions = user.submissions.length
      const campaignsParticipated = new Set(user.submissions.map(s => s.campaignId)).size

      return {
        totalViews,
        totalEarnings,
        activeSubmissions,
        campaignsParticipated
      }

    } catch (error) {
      console.error(`Error getting user stats for ${userId}:`, error)
      throw error
    }
  }
}
