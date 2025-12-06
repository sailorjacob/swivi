import { prisma } from "@/lib/prisma"

export interface PaymentCalculation {
  clipId: string
  submissionId: string
  userId: string
  campaignId: string
  viewsGained: number
  payoutRate: number
  earnings: number
  platform: string
  campaignTitle: string
  userName?: string
  userEmail?: string
  paymentMethod?: 'wallet' | 'paypal' | 'bank'
  paymentAddress?: string
}

export interface CampaignBudgetStatus {
  campaignId: string
  title: string
  totalBudget: number
  spentBudget: number
  remainingBudget: number
  progressPercentage: number
  totalEarnings: number
  totalClips: number
  isCompleted: boolean
}

export interface PendingPayment {
  userId: string
  userName?: string
  userEmail?: string
  paymentMethod: 'wallet' | 'paypal' | 'bank'
  paymentAddress: string
  totalEarnings: number
  clipsCount: number
  clips: PaymentCalculation[]
}

export class EnhancedPaymentCalculator {
  static async calculateClipEarnings(clipId: string): Promise<PaymentCalculation | null> {
    try {
      // Get clip with submission and campaign data
      const clip = await prisma.clip.findUnique({
        where: { id: clipId },
        include: {
          clipSubmissions: {
            include: {
              users: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  walletAddress: true,
                  paypalEmail: true
                }
              },
              campaigns: {
                select: {
                  id: true,
                  title: true,
                  payoutRate: true,
                  budget: true,
                  spent: true
                }
              }
            }
          },
          view_tracking: {
            orderBy: { date: "desc" },
            take: 2
          }
        }
      })

      if (!clip || !clip.clipSubmissions.length) {
        return null
      }

      const submission = clip.clipSubmissions[0]
      const campaign = submission.campaigns
      const user = submission.users

      if (!campaign) {
        return null
      }

      // Calculate view growth
      const latest = clip.view_tracking[0]
      const previous = clip.view_tracking[1]

      if (!latest || !previous) {
        return null // Need at least 2 tracking records
      }

      const viewsGained = Number(latest.views) - Number(previous.views)
      const payoutRate = Number(campaign.payoutRate)

      // Calculate earnings based on views per 1K views rate
      const earnings = (viewsGained / 1000) * payoutRate

      // Determine payment method and address
      const paymentMethod = user.walletAddress ? 'wallet' : user.paypalEmail ? 'paypal' : 'bank'
      const paymentAddress = user.walletAddress || user.paypalEmail || user.email || 'No payment method configured'

      return {
        clipId: clip.id,
        submissionId: submission.id,
        userId: user.id,
        campaignId: campaign.id,
        viewsGained,
        payoutRate,
        earnings,
        platform: clip.platform,
        campaignTitle: campaign.title,
        userName: user.name || undefined,
        userEmail: user.email || undefined,
        paymentMethod,
        paymentAddress
      }

    } catch (error) {
      console.error("Error calculating clip earnings:", error)
      return null
    }
  }

  static async calculateCampaignEarnings(campaignId: string): Promise<{
    calculations: PaymentCalculation[]
    budgetStatus: CampaignBudgetStatus
  }> {
    try {
      // Get campaign details
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: {
          id: true,
          title: true,
          budget: true,
          spent: true,
          payoutRate: true
        }
      })

      if (!campaign) {
        return { calculations: [], budgetStatus: null as any }
      }

      // Get all approved clips for this campaign
      const clips = await prisma.clip.findMany({
        where: {
          clipSubmissions: {
            some: {
              campaignId: campaignId,
              status: "APPROVED"
            }
          }
        },
        include: {
          clipSubmissions: {
            where: { campaignId: campaignId },
            include: {
              users: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  walletAddress: true,
                  paypalEmail: true
                }
              },
              campaigns: {
                select: {
                  id: true,
                  title: true,
                  payoutRate: true,
                  budget: true,
                  spent: true
                }
              }
            }
          },
          view_tracking: {
            orderBy: { date: "desc" },
            take: 2
          }
        }
      })

      const calculations: PaymentCalculation[] = []

      for (const clip of clips) {
        const calculation = await this.calculateClipEarnings(clip.id)
        if (calculation && calculation.earnings > 0) {
          calculations.push(calculation)
        }
      }

      // Calculate budget status
      const totalBudget = Number(campaign.budget)
      const spentBudget = Number(campaign.spent || 0)
      const remainingBudget = totalBudget - spentBudget
      const progressPercentage = totalBudget > 0 ? (spentBudget / totalBudget) * 100 : 0
      const totalEarnings = calculations.reduce((sum, calc) => sum + calc.earnings, 0)

      const budgetStatus: CampaignBudgetStatus = {
        campaignId: campaign.id,
        title: campaign.title,
        totalBudget,
        spentBudget,
        remainingBudget,
        progressPercentage,
        totalEarnings,
        totalClips: clips.length,
        isCompleted: progressPercentage >= 100 || remainingBudget <= 0
      }

      return { calculations, budgetStatus }

    } catch (error) {
      console.error("Error calculating campaign earnings:", error)
      return { calculations: [], budgetStatus: null as any }
    }
  }

  static async getUserPaymentInfo(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          walletAddress: true,
          paypalEmail: true,
          name: true,
          email: true
        }
      })

      if (!user) return null

      return {
        ...user,
        paymentMethod: user.walletAddress ? 'wallet' : user.paypalEmail ? 'paypal' : 'bank',
        paymentAddress: user.walletAddress || user.paypalEmail || user.email || 'No payment method configured'
      }

    } catch (error) {
      console.error("Error getting user payment info:", error)
      return null
    }
  }

  static async getAllPendingPayments(): Promise<{
    users: PendingPayment[]
    totalPendingAmount: number
  }> {
    try {
      // Get all clips with positive earnings that haven't been paid
      const clips = await prisma.clip.findMany({
        where: {
          earnings: { gt: 0 },
          // Only include clips that are approved and have earnings
          clipSubmissions: {
            some: {
              status: "APPROVED"
            }
          }
        },
        include: {
          clipSubmissions: {
            include: {
              users: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  walletAddress: true,
                  paypalEmail: true
                }
              },
              campaigns: {
                select: {
                  id: true,
                  title: true,
                  payoutRate: true
                }
              }
            }
          },
          view_tracking: {
            orderBy: { date: "desc" },
            take: 2
          }
        }
      })

      const userPayments = new Map<string, PendingPayment>()

      let totalPendingAmount = 0

      for (const clip of clips) {
        const calculation = await this.calculateClipEarnings(clip.id)
        if (calculation && calculation.earnings > 0) {
          const userId = calculation.userId

          if (!userPayments.has(userId)) {
            const user = clip.clipSubmissions[0].users
            userPayments.set(userId, {
              userId,
              userName: user.name || undefined,
              userEmail: user.email || undefined,
              paymentMethod: user.walletAddress ? 'wallet' : user.paypalEmail ? 'paypal' : 'bank',
              paymentAddress: user.walletAddress || user.paypalEmail || user.email || 'No payment method configured',
              totalEarnings: 0,
              clipsCount: 0,
              clips: []
            })
          }

          const userPayment = userPayments.get(userId)!
          userPayment.totalEarnings += calculation.earnings
          userPayment.clipsCount += 1
          userPayment.clips.push(calculation)
          totalPendingAmount += calculation.earnings
        }
      }

      return {
        users: Array.from(userPayments.values()),
        totalPendingAmount
      }

    } catch (error) {
      console.error("Error getting all pending payments:", error)
      return { users: [], totalPendingAmount: 0 }
    }
  }

  /**
   * @deprecated DO NOT USE - This function resets clip.earnings which breaks the view tracking system.
   * Use the payout request flow instead:
   * 1. Creators request payouts via /api/creators/payout-request
   * 2. Admins process via /api/admin/payout-requests/[id]/process
   * 
   * The proper flow decrements user.totalEarnings without touching clip.earnings,
   * preventing double-payment issues when view tracking recalculates.
   */
  static async markPaymentsAsPaid(_userIds: string[], _paymentMethod: 'wallet' | 'paypal' | 'bank', _notes?: string): Promise<{
    success: boolean
    paidCount: number
    error?: string
  }> {
    console.error('❌ DEPRECATED: markPaymentsAsPaid should not be used! Use payout request system instead.')
    return {
      success: false,
      paidCount: 0,
      error: "DEPRECATED: This function has been disabled. Use the payout request system at /api/admin/payout-requests instead."
    }
  }
}
