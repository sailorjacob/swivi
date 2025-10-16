import { prisma } from './prisma'
import { CampaignStatus, SubmissionStatus } from '@prisma/client'

interface PayoutCalculationResult {
  campaignId: string
  totalSpent: number
  remainingBudget: number
  campaignStatus: CampaignStatus
  shouldComplete: boolean
  payouts: Array<{
    submissionId: string
    userId: string
    views: number
    payoutAmount: number
    platform: string
  }>
}

interface CampaignBudgetUpdate {
  campaignId: string
  spent: number
  status: CampaignStatus
}

export class PayoutCalculationService {

  /**
   * Calculates payouts for all active campaigns and updates campaign budgets
   */
  async calculateAllCampaignPayouts(): Promise<PayoutCalculationResult[]> {
    try {
      // Get all active campaigns
      const activeCampaigns = await prisma.campaign.findMany({
        where: {
          status: {
            in: ['ACTIVE', 'PAUSED']
          }
        },
        include: {
          clipSubmissions: {
            where: {
              status: 'APPROVED'
            },
            include: {
              clip: {
                include: {
                  viewTracking: true
                }
              },
              users: true
            }
          }
        }
      })

      const results: PayoutCalculationResult[] = []

      for (const campaign of activeCampaigns) {
        const result = await this.calculateCampaignPayouts(campaign.id)
        results.push(result)

        // Update campaign budget and status if needed
        if (result.shouldComplete) {
          await this.updateCampaignBudget(result)
        }
      }

      return results

    } catch (error) {
      console.error('Error calculating all campaign payouts:', error)
      throw error
    }
  }

  /**
   * Calculates payouts for a specific campaign
   */
  async calculateCampaignPayouts(campaignId: string): Promise<PayoutCalculationResult> {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          clipSubmissions: {
            where: {
              status: 'APPROVED'
            },
            include: {
              clip: {
                include: {
                  viewTracking: true
                }
              },
              users: true
            }
          }
        }
      })

      if (!campaign) {
        throw new Error(`Campaign not found: ${campaignId}`)
      }

      const payouts: Array<{
        submissionId: string
        userId: string
        views: number
        payoutAmount: number
        platform: string
      }> = []

      let totalSpent = 0

      // Calculate payouts for each approved submission
      for (const submission of campaign.clipSubmissions) {
        if (!submission.clip) continue

        // Get latest view tracking data
        const latestTracking = submission.clip.viewTracking
          .sort((a, b) => b.date.getTime() - a.date.getTime())[0]

        const views = latestTracking ? Number(latestTracking.views) : 0
        const payoutAmount = this.calculatePayoutAmount(views, campaign.payoutRate)

        if (payoutAmount > 0) {
          payouts.push({
            submissionId: submission.id,
            userId: submission.userId,
            views,
            payoutAmount,
            platform: submission.platform
          })

          totalSpent += payoutAmount
        }
      }

      const remainingBudget = Number(campaign.budget) - Number(campaign.spent || 0) - totalSpent
      const shouldComplete = remainingBudget <= 0

      return {
        campaignId,
        totalSpent,
        remainingBudget,
        campaignStatus: shouldComplete ? 'COMPLETED' : campaign.status || 'ACTIVE',
        shouldComplete,
        payouts
      }

    } catch (error) {
      console.error(`Error calculating payouts for campaign ${campaignId}:`, error)
      throw error
    }
  }

  /**
   * Updates campaign budget and status
   */
  async updateCampaignBudget(result: PayoutCalculationResult): Promise<void> {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: result.campaignId }
      })

      if (!campaign) {
        throw new Error(`Campaign not found: ${result.campaignId}`)
      }

      const newSpent = Number(campaign.spent || 0) + result.totalSpent
      const newStatus = result.campaignStatus

      await prisma.campaign.update({
        where: { id: result.campaignId },
        data: {
          spent: newSpent,
          status: newStatus
        }
      })

      // Update user earnings for each payout
      for (const payout of result.payouts) {
        await this.updateUserEarnings(payout.userId, payout.payoutAmount)
      }

      console.log(`Updated campaign ${result.campaignId}: spent=${newSpent}, status=${newStatus}`)

    } catch (error) {
      console.error(`Error updating campaign budget for ${result.campaignId}:`, error)
      throw error
    }
  }

  /**
   * Updates user's total earnings
   */
  async updateUserEarnings(userId: string, payoutAmount: number): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          totalEarnings: {
            increment: payoutAmount
          }
        }
      })
    } catch (error) {
      console.error(`Error updating user earnings for ${userId}:`, error)
      throw error
    }
  }

  /**
   * Calculates payout amount based on views and rate
   */
  private calculatePayoutAmount(views: number, payoutRate: number): number {
    // Payout rate is per 1,000 views (CPM model)
    const viewsInThousands = views / 1000
    return Math.round((viewsInThousands * payoutRate) * 100) / 100 // Round to 2 decimal places
  }

  /**
   * Gets campaign statistics including budget utilization
   */
  async getCampaignStats(campaignId: string): Promise<{
    totalBudget: number
    totalSpent: number
    remainingBudget: number
    utilizationPercentage: number
    totalSubmissions: number
    approvedSubmissions: number
    totalViews: number
    averagePayoutPerSubmission: number
    projectedCompletionDate: Date | null
  }> {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          clipSubmissions: {
            where: {
              status: 'APPROVED'
            },
            include: {
              clip: {
                include: {
                  viewTracking: true
                }
              }
            }
          }
        }
      })

      if (!campaign) {
        throw new Error(`Campaign not found: ${campaignId}`)
      }

      const totalBudget = Number(campaign.budget)
      const totalSpent = Number(campaign.spent || 0)
      const remainingBudget = totalBudget - totalSpent
      const utilizationPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

      const totalSubmissions = campaign.clipSubmissions.length
      const approvedSubmissions = campaign.clipSubmissions.filter(s => s.status === 'APPROVED').length

      // Calculate total views from approved submissions
      const totalViews = campaign.clipSubmissions.reduce((sum, submission) => {
        if (!submission.clip) return sum
        const latestTracking = submission.clip.viewTracking
          .sort((a, b) => b.date.getTime() - a.date.getTime())[0]
        return sum + (latestTracking ? Number(latestTracking.views) : 0)
      }, 0)

      const totalPayouts = campaign.clipSubmissions.reduce((sum, submission) => {
        return sum + Number(submission.payout || 0)
      }, 0)

      const averagePayoutPerSubmission = approvedSubmissions > 0 ? totalPayouts / approvedSubmissions : 0

      // Estimate completion date based on current spending rate
      let projectedCompletionDate: Date | null = null
      if (totalSpent > 0 && remainingBudget > 0) {
        const daysSinceStart = campaign.startDate
          ? Math.max(1, Math.ceil((Date.now() - campaign.startDate.getTime()) / (1000 * 60 * 60 * 24)))
          : 1

        const dailySpendRate = totalSpent / daysSinceStart
        const daysToCompletion = dailySpendRate > 0 ? remainingBudget / dailySpendRate : 0

        if (daysToCompletion > 0 && daysToCompletion < 365) { // Only project if reasonable
          projectedCompletionDate = new Date()
          projectedCompletionDate.setDate(projectedCompletionDate.getDate() + Math.ceil(daysToCompletion))
        }
      }

      return {
        totalBudget,
        totalSpent,
        remainingBudget,
        utilizationPercentage,
        totalSubmissions,
        approvedSubmissions,
        totalViews,
        averagePayoutPerSubmission,
        projectedCompletionDate
      }

    } catch (error) {
      console.error(`Error getting campaign stats for ${campaignId}:`, error)
      throw error
    }
  }

  /**
   * Processes pending payouts and marks submissions as paid
   */
  async processPendingPayouts(campaignId?: string): Promise<void> {
    try {
      const whereClause: any = {
        status: 'APPROVED',
        payout: {
          not: null,
          gt: 0
        }
      }

      if (campaignId) {
        whereClause.campaignId = campaignId
      }

      const submissionsToPay = await prisma.clipSubmission.findMany({
        where: whereClause,
        include: {
          campaign: true,
          users: true
        }
      })

      for (const submission of submissionsToPay) {
        // Create payout record
        await prisma.payout.create({
          data: {
            userId: submission.userId,
            amount: submission.payout || 0,
            currency: 'USD',
            method: 'PAYPAL', // Default method - should be configurable
            status: 'PENDING',
            paypalEmail: submission.users.paypalEmail,
            netAmount: submission.payout || 0
          }
        })

        // Mark submission as paid
        await prisma.clipSubmission.update({
          where: { id: submission.id },
          data: {
            status: 'PAID',
            paidAt: new Date()
          }
        })

        console.log(`Processed payout for submission ${submission.id}: $${submission.payout}`)
      }

    } catch (error) {
      console.error('Error processing pending payouts:', error)
      throw error
    }
  }
}
