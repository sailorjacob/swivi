import { prisma } from './prisma'
import { NotificationType } from '@prisma/client'

interface NotificationData {
  title: string
  message: string
  type: NotificationType
  userId: string
  data?: any
}

interface NotificationTemplate {
  title: string
  message: string
}

export class NotificationService {

  /**
   * Creates and sends a notification to a user
   */
  async createNotification(data: NotificationData): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data || null
        }
      })

      console.log(`Notification created for user ${data.userId}: ${data.title}`)

      // TODO: Send real-time notification (WebSocket, push notification, etc.)
      await this.sendRealTimeNotification(data)

    } catch (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  }

  /**
   * Creates notifications for multiple users
   */
  async createBulkNotifications(notifications: NotificationData[]): Promise<void> {
    try {
      const notificationData = notifications.map(n => ({
        userId: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        data: n.data || null
      }))

      await prisma.notification.createMany({
        data: notificationData
      })

      console.log(`Created ${notifications.length} notifications`)

      // Send real-time notifications
      for (const notification of notifications) {
        await this.sendRealTimeNotification(notification)
      }

    } catch (error) {
      console.error('Error creating bulk notifications:', error)
      throw error
    }
  }

  /**
   * Marks a notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId: userId
        },
        data: {
          read: true,
          readAt: new Date()
        }
      })
    } catch (error) {
      console.error('Error marking notification as read:', error)
      throw error
    }
  }

  /**
   * Marks all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          userId: userId,
          read: false
        },
        data: {
          read: true,
          readAt: new Date()
        }
      })
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      throw error
    }
  }

  /**
   * Gets notifications for a user
   */
  async getUserNotifications(userId: string, options?: {
    limit?: number
    offset?: number
    unreadOnly?: boolean
  }): Promise<{
    notifications: any[]
    total: number
    unread: number
  }> {
    try {
      const { limit = 50, offset = 0, unreadOnly = false } = options || {}

      const whereClause: any = { userId }
      if (unreadOnly) {
        whereClause.read = false
      }

      const [notifications, total, unread] = await Promise.all([
        prisma.notification.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        }),
        prisma.notification.count({ where: whereClause }),
        prisma.notification.count({
          where: { userId, read: false }
        })
      ])

      return {
        notifications,
        total,
        unread
      }
    } catch (error) {
      console.error('Error getting user notifications:', error)
      throw error
    }
  }

  /**
   * Creates a notification when a submission is approved
   */
  async notifySubmissionApproved(submissionId: string, userId: string, campaignTitle: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'SUBMISSION_APPROVED',
      title: 'Submission Approved!',
      message: `Your submission for "${campaignTitle}" has been approved and is now earning based on views.`,
      data: { submissionId, campaignTitle }
    })
  }

  /**
   * Creates a notification when a submission is rejected
   */
  async notifySubmissionRejected(submissionId: string, userId: string, campaignTitle: string, reason?: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'SUBMISSION_REJECTED',
      title: 'Submission Not Approved',
      message: `Your submission for "${campaignTitle}" was not approved.${reason ? ` Reason: ${reason}` : ''}`,
      data: { submissionId, campaignTitle, reason }
    })
  }

  /**
   * Creates a notification when a payout is processed
   */
  async notifyPayoutProcessed(userId: string, amount: number, payoutId: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'PAYOUT_PROCESSED',
      title: 'Payout Processed!',
      message: `Your payout of $${amount.toFixed(2)} has been processed successfully.`,
      data: { payoutId, amount }
    })
  }

  /**
   * Creates a notification when a campaign is completed
   */
  async notifyCampaignCompleted(campaignId: string, campaignTitle: string): Promise<void> {
    // Get all users who have approved submissions in this campaign
    const users = await prisma.user.findMany({
      where: {
        clipSubmissions: {
          some: {
            campaignId,
            status: 'APPROVED'
          }
        }
      }
    })

    const notifications = users.map(user => ({
      userId: user.id,
      type: 'CAMPAIGN_COMPLETED' as NotificationType,
      title: 'Campaign Completed',
      message: `The campaign "${campaignTitle}" has reached its budget and is now completed.`,
      data: { campaignId, campaignTitle }
    }))

    if (notifications.length > 0) {
      await this.createBulkNotifications(notifications)
    }
  }

  /**
   * Creates a notification when a new campaign is available
   */
  async notifyNewCampaignAvailable(campaignId: string, campaignTitle: string): Promise<void> {
    // Notify all active clippers
    const clippers = await prisma.user.findMany({
      where: {
        role: 'CLIPPER',
        verified: true
      }
    })

    const notifications = clippers.map(clipper => ({
      userId: clipper.id,
      type: 'NEW_CAMPAIGN_AVAILABLE' as NotificationType,
      title: 'New Campaign Available!',
      message: `A new campaign "${campaignTitle}" is now available. Check it out and start earning!`,
      data: { campaignId, campaignTitle }
    }))

    if (notifications.length > 0) {
      await this.createBulkNotifications(notifications)
    }
  }

  /**
   * Creates a notification when a payout is ready
   */
  async notifyPayoutReady(userId: string, amount: number, campaignTitle: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'PAYOUT_READY',
      title: 'Earnings Available!',
      message: `You have $${amount.toFixed(2)} available from "${campaignTitle}". Request your payout now!`,
      data: { amount, campaignTitle }
    })
  }

  /**
   * Creates a notification for social verification success
   */
  async notifyVerificationSuccess(userId: string, platform: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'VERIFICATION_SUCCESS',
      title: 'Social Account Verified!',
      message: `Your ${platform} account has been successfully verified. You can now participate in campaigns!`,
      data: { platform }
    })
  }

  /**
   * Creates a notification for social verification failure
   */
  async notifyVerificationFailed(userId: string, platform: string, reason: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'VERIFICATION_FAILED',
      title: 'Verification Failed',
      message: `Your ${platform} account verification failed. ${reason}`,
      data: { platform, reason }
    })
  }

  /**
   * Sends real-time notification (placeholder for WebSocket/push notifications)
   */
  private async sendRealTimeNotification(data: NotificationData): Promise<void> {
    // TODO: Implement real-time notifications
    // This could use WebSockets, Server-Sent Events, or push notifications

    console.log(`Real-time notification for user ${data.userId}: ${data.title}`)

    // Example WebSocket implementation:
    /*
    if (global.notificationWebSocket) {
      global.notificationWebSocket.send(JSON.stringify({
        type: 'notification',
        userId: data.userId,
        notification: {
          id: generateId(),
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data,
          createdAt: new Date().toISOString()
        }
      }))
    }
    */
  }

  /**
   * Gets notification statistics for admin dashboard
   */
  async getNotificationStats(): Promise<{
    totalNotifications: number
    unreadNotifications: number
    notificationsByType: Record<string, number>
    recentActivity: any[]
  }> {
    try {
      const [totalNotifications, unreadNotifications, notificationsByType, recentActivity] = await Promise.all([
        prisma.notification.count(),
        prisma.notification.count({ where: { read: false } }),
        prisma.notification.groupBy({
          by: ['type'],
          _count: {
            type: true
          }
        }),
        prisma.notification.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            users: {
              select: {
                name: true,
                email: true
              }
            }
          }
        })
      ])

      const typeStats = notificationsByType.reduce((acc, item) => {
        acc[item.type] = item._count.type
        return acc
      }, {} as Record<string, number>)

      return {
        totalNotifications,
        unreadNotifications,
        notificationsByType: typeStats,
        recentActivity
      }
    } catch (error) {
      console.error('Error getting notification stats:', error)
      throw error
    }
  }
}
