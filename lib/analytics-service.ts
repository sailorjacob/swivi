import { prisma } from './prisma'
import { CampaignStatus, SubmissionStatus, SocialPlatform } from '@prisma/client'

interface PlatformAnalytics {
  platform: SocialPlatform
  totalSubmissions: number
  approvedSubmissions: number
  totalViews: number
  averageViews: number
  totalEarnings: number
  conversionRate: number
}

interface CampaignAnalytics {
  campaignId: string
  title: string
  status: CampaignStatus
  budget: number
  spent: number
  budgetUtilization: number
  totalSubmissions: number
  approvedSubmissions: number
  totalViews: number
  averageViewsPerSubmission: number
  totalEarnings: number
  roi: number
  daysRunning: number
  dailySpendRate: number
}

interface UserAnalytics {
  userId: string
  name: string
  email: string
  totalViews: number
  totalEarnings: number
  totalSubmissions: number
  approvedSubmissions: number
  averageViewsPerSubmission: number
  averageEarningsPerSubmission: number
  joinDate: Date
  lastActivity: Date
}

interface TimeSeriesData {
  date: string
  views: number
  submissions: number
  earnings: number
  users: number
}

export class AnalyticsService {

  /**
   * Gets comprehensive platform analytics
   */
  async getPlatformAnalytics(): Promise<PlatformAnalytics[]> {
    try {
      const platforms: SocialPlatform[] = ['TIKTOK', 'YOUTUBE', 'INSTAGRAM', 'TWITTER']

      const platformAnalytics: PlatformAnalytics[] = []

      for (const platform of platforms) {
        const [
          totalSubmissions,
          approvedSubmissions,
          totalViews,
          totalEarnings
        ] = await Promise.all([
          // Total submissions for this platform
          prisma.clipSubmission.count({
            where: { platform }
          }),

          // Approved submissions for this platform
          prisma.clipSubmission.count({
            where: {
              platform,
              status: 'APPROVED'
            }
          }),

          // Total views for this platform
          prisma.viewTracking.aggregate({
            where: { platform },
            _sum: { views: true }
          }),

          // Total earnings for this platform
          prisma.clipSubmission.aggregate({
            where: {
              platform,
              status: 'PAID',
              payout: { not: null }
            },
            _sum: { payout: true }
          })
        ])

        const views = Number(totalViews._sum.views || 0)
        const earnings = Number(totalEarnings._sum.payout || 0)
        const averageViews = approvedSubmissions > 0 ? views / approvedSubmissions : 0
        const conversionRate = totalSubmissions > 0 ? (approvedSubmissions / totalSubmissions) * 100 : 0

        platformAnalytics.push({
          platform,
          totalSubmissions,
          approvedSubmissions,
          totalViews: views,
          averageViews,
          totalEarnings: earnings,
          conversionRate
        })
      }

      return platformAnalytics

    } catch (error) {
      console.error('Error getting platform analytics:', error)
      throw error
    }
  }

  /**
   * Gets detailed campaign analytics
   */
  async getCampaignAnalytics(limit = 20): Promise<CampaignAnalytics[]> {
    try {
      const campaigns = await prisma.campaign.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          clipSubmissions: {
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

      return campaigns.map(campaign => {
        const totalSubmissions = campaign.clipSubmissions.length
        const approvedSubmissions = campaign.clipSubmissions.filter(s => s.status === 'APPROVED').length

        // Use clip.views (MAX ever tracked) as source of truth
        const totalViews = campaign.clipSubmissions.reduce((sum, submission) => {
          // Prefer clip.views over viewTracking[0] since clip.views stores MAX
          const views = Number(submission.clips?.views || submission.clips?.viewTracking?.[0]?.views || 0)
          return sum + views
        }, 0)

        const totalEarnings = campaign.clipSubmissions
          .filter(s => s.status === 'PAID' && s.payout)
          .reduce((sum, s) => sum + Number(s.payout || 0), 0)

        const budget = Number(campaign.budget)
        const spent = Number(campaign.spent || 0)
        const budgetUtilization = budget > 0 ? (spent / budget) * 100 : 0

        const averageViewsPerSubmission = approvedSubmissions > 0 ? totalViews / approvedSubmissions : 0

        const daysRunning = campaign.startDate
          ? Math.max(1, Math.ceil((Date.now() - campaign.startDate.getTime()) / (1000 * 60 * 60 * 24)))
          : 1

        const dailySpendRate = daysRunning > 0 ? spent / daysRunning : 0

        // ROI calculation: (earnings - budget) / budget * 100
        const roi = budget > 0 ? ((spent - budget) / budget) * 100 : 0

        return {
          campaignId: campaign.id,
          title: campaign.title,
          status: campaign.status || 'DRAFT',
          budget,
          spent,
          budgetUtilization,
          totalSubmissions,
          approvedSubmissions,
          totalViews,
          averageViewsPerSubmission,
          totalEarnings,
          roi,
          daysRunning,
          dailySpendRate
        }
      })

    } catch (error) {
      console.error('Error getting campaign analytics:', error)
      throw error
    }
  }

  /**
   * Gets top performing users analytics
   */
  async getTopUsersAnalytics(limit = 20): Promise<UserAnalytics[]> {
    try {
      const users = await prisma.user.findMany({
        where: {
          role: 'CLIPPER',
          clipSubmissions: {
            some: {
              status: {
                in: ['APPROVED', 'PAID']
              }
            }
          }
        },
        take: limit,
        orderBy: { totalEarnings: 'desc' },
        include: {
          clipSubmissions: {
            where: {
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
          }
        }
      })

      return users.map(user => {
        const totalSubmissions = user.clipSubmissions.length
        const approvedSubmissions = user.clipSubmissions.filter(s => s.status === 'APPROVED').length

        // Use clip.views (MAX ever tracked) as source of truth
        const totalViews = user.clipSubmissions.reduce((sum, submission) => {
          // Prefer clip.views over viewTracking[0] since clip.views stores MAX
          const views = Number(submission.clip?.views || submission.clip?.viewTracking?.[0]?.views || 0)
          return sum + views
        }, 0)

        const totalEarnings = user.clipSubmissions
          .filter(s => s.status === 'PAID' && s.payout)
          .reduce((sum, s) => sum + Number(s.payout || 0), 0)

        const averageViewsPerSubmission = approvedSubmissions > 0 ? totalViews / approvedSubmissions : 0
        const averageEarningsPerSubmission = approvedSubmissions > 0 ? totalEarnings / approvedSubmissions : 0

        // Get last activity date
        const lastActivity = user.clipSubmissions.length > 0
          ? new Date(Math.max(...user.clipSubmissions.map(s => s.updatedAt.getTime())))
          : user.createdAt

        return {
          userId: user.id,
          name: user.name || 'Unknown',
          email: user.email,
          totalViews: Number(user.totalViews),
          totalEarnings: Number(user.totalEarnings),
          totalSubmissions,
          approvedSubmissions,
          averageViewsPerSubmission,
          averageEarningsPerSubmission,
          joinDate: user.createdAt,
          lastActivity
        }
      })

    } catch (error) {
      console.error('Error getting top users analytics:', error)
      throw error
    }
  }

  /**
   * Gets time series data for trends analysis
   */
  async getTimeSeriesAnalytics(days = 30): Promise<TimeSeriesData[]> {
    try {
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000))

      // Generate date range
      const dateRange: Date[] = []
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        dateRange.push(new Date(d))
      }

      const timeSeriesData: TimeSeriesData[] = []

      for (const date of dateRange) {
        const dayStart = new Date(date)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(date)
        dayEnd.setHours(23, 59, 59, 999)

        const [
          dayViews,
          daySubmissions,
          dayEarnings,
          newUsers
        ] = await Promise.all([
          // Views for this day
          prisma.viewTracking.aggregate({
            where: {
              date: {
                gte: dayStart,
                lte: dayEnd
              }
            },
            _sum: { views: true }
          }),

          // Submissions for this day
          prisma.clipSubmission.count({
            where: {
              createdAt: {
                gte: dayStart,
                lte: dayEnd
              }
            }
          }),

          // Earnings for this day (paid submissions)
          prisma.clipSubmission.aggregate({
            where: {
              status: 'PAID',
              paidAt: {
                gte: dayStart,
                lte: dayEnd
              }
            },
            _sum: { payout: true }
          }),

          // New users for this day
          prisma.user.count({
            where: {
              createdAt: {
                gte: dayStart,
                lte: dayEnd
              }
            }
          })
        ])

        timeSeriesData.push({
          date: date.toISOString().split('T')[0],
          views: Number(dayViews._sum.views || 0),
          submissions: daySubmissions,
          earnings: Number(dayEarnings._sum.payout || 0),
          users: newUsers
        })
      }

      return timeSeriesData

    } catch (error) {
      console.error('Error getting time series analytics:', error)
      throw error
    }
  }

  /**
   * Gets conversion funnel analytics
   */
  async getConversionFunnel(): Promise<{
    totalUsers: number
    verifiedUsers: number
    activeUsers: number
    submittingUsers: number
    approvedSubmissions: number
    paidSubmissions: number
    conversionRates: {
      verificationRate: number
      activityRate: number
      submissionRate: number
      approvalRate: number
      payoutRate: number
    }
  }> {
    try {
      const [
        totalUsers,
        verifiedUsers,
        activeUsers,
        submittingUsers,
        approvedSubmissions,
        paidSubmissions
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { verified: true } }),
        prisma.user.count({
          where: {
            clipSubmissions: {
              some: {}
            }
          }
        }),
        prisma.user.count({
          where: {
            clipSubmissions: {
              some: {
                status: {
                  in: ['APPROVED', 'PAID']
                }
              }
            }
          }
        }),
        prisma.clipSubmission.count({ where: { status: 'APPROVED' } }),
        prisma.clipSubmission.count({ where: { status: 'PAID' } })
      ])

      const conversionRates = {
        verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0,
        activityRate: verifiedUsers > 0 ? (activeUsers / verifiedUsers) * 100 : 0,
        submissionRate: activeUsers > 0 ? (submittingUsers / activeUsers) * 100 : 0,
        approvalRate: approvedSubmissions > 0 ? (paidSubmissions / approvedSubmissions) * 100 : 0,
        payoutRate: submittingUsers > 0 ? (paidSubmissions / submittingUsers) * 100 : 0
      }

      return {
        totalUsers,
        verifiedUsers,
        activeUsers,
        submittingUsers,
        approvedSubmissions,
        paidSubmissions,
        conversionRates
      }

    } catch (error) {
      console.error('Error getting conversion funnel:', error)
      throw error
    }
  }

  /**
   * Gets comprehensive dashboard overview
   */
  async getDashboardOverview(): Promise<{
    overview: {
      totalUsers: number
      activeUsers: number
      totalCampaigns: number
      activeCampaigns: number
      totalSubmissions: number
      pendingSubmissions: number
      approvedSubmissions: number
      paidSubmissions: number
      totalViews: number
      trackedViews: number
      totalEarnings: number
      averagePayout: number
    }
    platformBreakdown: Record<string, number>
    recentActivity: Array<{
      type: string
      description: string
      timestamp: Date
      user?: string
    }>
    topPerformers: Array<{
      userId: string
      name: string
      earnings: number
      views: number
    }>
  }> {
    try {
      const [
        totalUsers,
        activeUsers,
        totalCampaigns,
        activeCampaigns,
        totalSubmissions,
        pendingSubmissions,
        approvedSubmissions,
        paidSubmissions,
        totalViews,
        trackedViews,
        totalEarnings,
        averagePayout,
        platformBreakdown,
        topUsers
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: {
            updatedAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Active in last 30 days
            }
          }
        }),
        prisma.campaign.count(),
        prisma.campaign.count({ where: { status: 'ACTIVE' } }),
        prisma.clipSubmission.count(),
        prisma.clipSubmission.count({ where: { status: 'PENDING' } }),
        prisma.clipSubmission.count({ where: { status: 'APPROVED' } }),
        prisma.clipSubmission.count({ where: { status: 'PAID' } }),
        prisma.user.aggregate({ _sum: { totalViews: true } }),
        prisma.viewTracking.aggregate({ _sum: { views: true } }), // Tracked views from scrapes
        prisma.user.aggregate({ _sum: { totalEarnings: true } }),
        prisma.clipSubmission.aggregate({
          where: { status: 'PAID', payout: { not: null } },
          _avg: { payout: true }
        }),
        prisma.clipSubmission.groupBy({
          by: ['platform'],
          _count: { platform: true }
        }),
        prisma.user.findMany({
          take: 5,
          orderBy: { totalEarnings: 'desc' },
          select: {
            id: true,
            name: true,
            totalEarnings: true,
            totalViews: true
          }
        })
      ])

      // Get recent activity
      const recentActivity = await this.getRecentActivity()

      return {
        overview: {
          totalUsers,
          activeUsers,
          totalCampaigns,
          activeCampaigns,
          totalSubmissions,
          pendingSubmissions,
          approvedSubmissions,
          paidSubmissions,
          totalViews: Number(totalViews._sum.totalViews || 0),
          trackedViews: Number(trackedViews._sum.views || 0), // Views from tracking/scrapes
          totalEarnings: Number(totalEarnings._sum.totalEarnings || 0),
          averagePayout: Number(averagePayout._avg.payout || 0)
        },
        platformBreakdown: platformBreakdown.reduce((acc, item) => {
          acc[item.platform] = item._count.platform
          return acc
        }, {} as Record<string, number>),
        recentActivity,
        topPerformers: topUsers.map(user => ({
          userId: user.id,
          name: user.name || 'Unknown',
          earnings: Number(user.totalEarnings),
          views: Number(user.totalViews)
        }))
      }

    } catch (error) {
      console.error('Error getting dashboard overview:', error)
      throw error
    }
  }

  /**
   * Gets recent platform activity for activity feed
   */
  private async getRecentActivity(limit = 20): Promise<Array<{
    type: string
    description: string
    timestamp: Date
    user?: string
  }>> {
    try {
      const [
        recentSubmissions,
        recentPayouts,
        recentCampaigns
      ] = await Promise.all([
        prisma.clipSubmission.findMany({
          take: limit / 3,
          orderBy: { createdAt: 'desc' },
          include: {
            users: { select: { name: true, email: true } },
            campaigns: { select: { title: true } }
          }
        }),
        prisma.payout.findMany({
          take: limit / 3,
          orderBy: { createdAt: 'desc' },
          include: {
            users: { select: { name: true, email: true } }
          }
        }),
        prisma.campaign.findMany({
          take: limit / 3,
          orderBy: { createdAt: 'desc' },
          select: {
            title: true,
            creator: true,
            createdAt: true
          }
        })
      ])

      const activity = [
        ...recentSubmissions.map(s => ({
          type: 'submission',
          description: `${s.users.name || s.users.email} submitted to "${s.campaigns.title}"`,
          timestamp: s.createdAt,
          user: s.users.name || s.users.email || 'Unknown'
        })),
        ...recentPayouts.map(p => ({
          type: 'payout',
          description: `$${p.amount.toFixed(2)} payout processed`,
          timestamp: p.createdAt,
          user: p.users.name || p.users.paypalEmail || 'Unknown'
        })),
        ...recentCampaigns.map(c => ({
          type: 'campaign',
          description: `"${c.title}" campaign created by ${c.creator}`,
          timestamp: c.createdAt
        }))
      ]

      return activity
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit)

    } catch (error) {
      console.error('Error getting recent activity:', error)
      return []
    }
  }
}
