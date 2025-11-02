import { prisma } from '@/lib/prisma'

/**
 * Syncs campaign.spent with actual sum of approved clip earnings
 * This ensures campaign.spent is always accurate, even if cron updates fail
 */
export class CampaignSpendSync {
  
  /**
   * Sync a specific campaign's spent amount from actual clip earnings
   */
  static async syncCampaign(campaignId: string): Promise<{
    success: boolean
    campaignTitle: string
    oldSpent: number
    newSpent: number
    difference: number
    approvedClipsCount: number
  }> {
    try {
      // Get campaign
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: {
          id: true,
          title: true,
          spent: true,
          budget: true
        }
      })

      if (!campaign) {
        throw new Error(`Campaign not found: ${campaignId}`)
      }

      // Calculate actual spent from approved clip earnings
      const approvedSubmissions = await prisma.clipSubmission.findMany({
        where: {
          campaignId: campaignId,
          status: 'APPROVED',
          clipId: { not: null }
        },
        include: {
          clips: {
            select: {
              earnings: true
            }
          }
        }
      })

      const actualSpent = approvedSubmissions.reduce((sum, submission) => {
        return sum + Number(submission.clips?.earnings || 0)
      }, 0)

      const oldSpent = Number(campaign.spent || 0)
      const difference = actualSpent - oldSpent

      // Update campaign.spent to match actual
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          spent: actualSpent
        }
      })

      console.log(`✅ Synced campaign "${campaign.title}": $${oldSpent.toFixed(2)} → $${actualSpent.toFixed(2)} (diff: $${difference.toFixed(2)})`)

      return {
        success: true,
        campaignTitle: campaign.title,
        oldSpent,
        newSpent: actualSpent,
        difference,
        approvedClipsCount: approvedSubmissions.length
      }

    } catch (error) {
      console.error('Error syncing campaign:', error)
      throw error
    }
  }

  /**
   * Sync ALL campaigns (active, paused, completed)
   */
  static async syncAllCampaigns(): Promise<{
    success: boolean
    synced: number
    totalDifference: number
    campaigns: Array<{
      id: string
      title: string
      oldSpent: number
      newSpent: number
      difference: number
    }>
  }> {
    try {
      console.log('🔄 Starting campaign spend sync for all campaigns...')

      // Get all campaigns
      const campaigns = await prisma.campaign.findMany({
        select: {
          id: true,
          title: true,
          spent: true,
          status: true
        }
      })

      const results = []
      let totalDifference = 0

      for (const campaign of campaigns) {
        const result = await this.syncCampaign(campaign.id)
        results.push({
          id: campaign.id,
          title: result.campaignTitle,
          oldSpent: result.oldSpent,
          newSpent: result.newSpent,
          difference: result.difference
        })
        totalDifference += result.difference
      }

      console.log(`✅ Synced ${results.length} campaigns. Total difference: $${totalDifference.toFixed(2)}`)

      return {
        success: true,
        synced: results.length,
        totalDifference,
        campaigns: results
      }

    } catch (error) {
      console.error('Error syncing all campaigns:', error)
      throw error
    }
  }

  /**
   * Get sync status for all campaigns (preview without updating)
   */
  static async getSyncStatus(): Promise<Array<{
    id: string
    title: string
    status: string
    recordedSpent: number
    actualSpent: number
    difference: number
    needsSync: boolean
    approvedClipsCount: number
  }>> {
    try {
      const campaigns = await prisma.campaign.findMany({
        select: {
          id: true,
          title: true,
          status: true,
          spent: true,
          clipSubmissions: {
            where: {
              status: 'APPROVED',
              clipId: { not: null }
            },
            include: {
              clips: {
                select: {
                  earnings: true
                }
              }
            }
          }
        }
      })

      return campaigns.map(campaign => {
        const actualSpent = campaign.clipSubmissions.reduce((sum, sub) => {
          return sum + Number(sub.clips?.earnings || 0)
        }, 0)

        const recordedSpent = Number(campaign.spent || 0)
        const difference = actualSpent - recordedSpent

        return {
          id: campaign.id,
          title: campaign.title,
          status: campaign.status || 'UNKNOWN',
          recordedSpent,
          actualSpent,
          difference,
          needsSync: Math.abs(difference) > 0.01, // More than 1 cent difference
          approvedClipsCount: campaign.clipSubmissions.length
        }
      })

    } catch (error) {
      console.error('Error getting sync status:', error)
      throw error
    }
  }
}

