import { prisma } from '@/lib/prisma'
import { EnhancedPaymentCalculator } from '@/lib/enhanced-payment-calculation'

export interface CampaignCompletionCheck {
  campaignId: string
  title: string
  budget: number
  spent: number
  progressPercentage: number
  shouldComplete: boolean
  reason: string
  currentViews?: number
  estimatedFinalSpent?: number
}

export class CampaignCompletionService {
  /**
   * Check if campaigns should be completed based on budget utilization
   */
  static async checkCampaignCompletion(campaignId?: string): Promise<CampaignCompletionCheck[]> {
    try {
      // Build query for active campaigns
      const whereClause: any = { status: "ACTIVE" }

      if (campaignId) {
        whereClause.id = campaignId
      }

      const activeCampaigns = await prisma.campaign.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          budget: true,
          spent: true,
          status: true,
          targetPlatforms: true,
          createdAt: true
        }
      })

      const completionChecks: CampaignCompletionCheck[] = []

      for (const campaign of activeCampaigns) {
        const budget = Number(campaign.budget)
        const spent = Number(campaign.spent || 0)
        const progressPercentage = budget > 0 ? (spent / budget) * 100 : 0

        // Calculate if campaign should be completed
        let shouldComplete = false
        let reason = ""

        if (spent >= budget) {
          shouldComplete = true
          reason = `Budget fully utilized (${progressPercentage.toFixed(1)}%)`
        } else if (progressPercentage >= 95) {
          // Check if we're very close to completion (95%+) and might exceed with next view tracking
          shouldComplete = true
          reason = `Near budget completion (${progressPercentage.toFixed(1)}%) - preventing overage`
        }

        // Get current view tracking data for more accurate completion prediction
        const { calculations } = await EnhancedPaymentCalculator.calculateCampaignEarnings(campaign.id)
        const currentViews = calculations.reduce((sum, calc) => sum + calc.viewsGained, 0)

        // Estimate final spent based on current view tracking
        const estimatedFinalSpent = spent + calculations.reduce((sum, calc) => sum + calc.earnings, 0)

        completionChecks.push({
          campaignId: campaign.id,
          title: campaign.title,
          budget,
          spent,
          progressPercentage,
          shouldComplete,
          reason,
          currentViews,
          estimatedFinalSpent
        })
      }

      return completionChecks

    } catch (error) {
      console.error("Error checking campaign completion:", error)
      return []
    }
  }

  /**
   * Automatically complete campaigns that should be completed
   */
  static async autoCompleteCampaigns(): Promise<{
    completed: number
    skipped: number
    errors: Array<{ campaignId: string; error: string }>
  }> {
    try {
      const completionChecks = await this.checkCampaignCompletion()

      const results = {
        completed: 0,
        skipped: 0,
        errors: [] as Array<{ campaignId: string; error: string }>
      }

      for (const check of completionChecks) {
        if (check.shouldComplete) {
          try {
            // Complete the campaign
            await prisma.campaign.update({
              where: { id: check.campaignId },
              data: {
                status: "COMPLETED",
                completedAt: new Date(),
                completionReason: check.reason,
                spent: check.estimatedFinalSpent || check.spent // Use estimated or current spent
              }
            })

            // Send notifications to all clippers who submitted to this campaign
            await this.notifyClippersOfCompletion(check.campaignId, check.title, check.reason)

            results.completed++
            console.log(`✅ Auto-completed campaign: ${check.title} - ${check.reason}`)

          } catch (error) {
            results.errors.push({
              campaignId: check.campaignId,
              error: error instanceof Error ? error.message : "Unknown error"
            })
          }
        } else {
          results.skipped++
        }
      }

      return results

    } catch (error) {
      console.error("Error in auto campaign completion:", error)
      return {
        completed: 0,
        skipped: 0,
        errors: [{ campaignId: "system", error: error instanceof Error ? error.message : "Unknown error" }]
      }
    }
  }

  /**
   * Notify all clippers who submitted to a completed campaign
   */
  private static async notifyClippersOfCompletion(campaignId: string, campaignTitle: string, reason: string): Promise<void> {
    try {
      // Get all users who submitted to this campaign
      const submissions = await prisma.clipSubmission.findMany({
        where: {
          campaignId,
          status: { in: ["APPROVED", "PENDING"] } // Notify both approved and pending submissions
        },
        select: {
          userId: true,
          users: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        distinct: ["userId"] // Only one notification per user
      })

      // Send notifications to each unique user
      for (const submission of submissions) {
        await prisma.notification.create({
          data: {
            userId: submission.userId,
            type: "CAMPAIGN_COMPLETED",
            title: "Campaign Completed!",
            message: `"${campaignTitle}" has reached its budget limit and is now complete. ${reason}`,
            data: {
              campaignId,
              campaignTitle,
              reason
            }
          }
        })
      }

      console.log(`📢 Notified ${submissions.length} users about campaign completion: ${campaignTitle}`)

    } catch (error) {
      console.error("Error notifying clippers of campaign completion:", error)
    }
  }

  /**
   * Get campaigns that are near completion for monitoring
   */
  static async getNearCompletionCampaigns(threshold: number = 80): Promise<CampaignCompletionCheck[]> {
    try {
      const completionChecks = await this.checkCampaignCompletion()

      return completionChecks.filter(check =>
        check.progressPercentage >= threshold && !check.shouldComplete
      )

    } catch (error) {
      console.error("Error getting near completion campaigns:", error)
      return []
    }
  }

  /**
   * Manually complete a campaign with admin override
   */
  static async manuallyCompleteCampaign(campaignId: string, adminReason: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: {
          id: true,
          title: true,
          status: true
        }
      })

      if (!campaign) {
        return { success: false, error: "Campaign not found" }
      }

      if (campaign.status === "COMPLETED") {
        return { success: false, error: "Campaign is already completed" }
      }

      // Complete the campaign
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          completionReason: `Manually completed by admin: ${adminReason}`
        }
      })

      // Notify clippers
      await this.notifyClippersOfCompletion(campaignId, campaign.title, adminReason)

      return { success: true }

    } catch (error) {
      console.error("Error manually completing campaign:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    }
  }
}
