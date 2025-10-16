import { prisma } from './prisma'
import { Prisma, SocialPlatform } from '@prisma/client'

/**
 * Database utility functions for safe operations
 * Prevents connection issues and provides consistent error handling
 */

// Type definitions for better TypeScript support
export type ViewTrackingData = {
  userId: string
  clipId: string
  views: number
  date: Date
  platform: string
}

export type CampaignCreateData = {
  title: string
  description: string
  creator: string
  budget: number
  payoutRate: number
  startDate?: Date
  requirements?: string[]
  targetPlatforms?: SocialPlatform[]
}

/**
 * Safe database operation wrapper
 * Handles connection errors and retries
 */
export async function safeDbOperation<T>(
  operation: () => Promise<T>,
  retries = 3
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      // Handle prepared statement errors
      if (error.code === '42P05' && attempt < retries) {
        console.warn(`Database connection retry ${attempt}/${retries}`)
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        continue
      }
      
      console.error(`Database operation failed on attempt ${attempt}:`, error)
      if (attempt === retries) {
        throw new Error(`Database operation failed after ${retries} attempts: ${error.message}`)
      }
    }
  }
  throw new Error('Should not reach here')
}

/**
 * View tracking with atomic operations
 * Updates both ViewTracking and Clip tables
 */
export async function trackViews(data: ViewTrackingData) {
  return safeDbOperation(async () => {
    return await prisma.$transaction(async (tx) => {
      // Create view tracking record
      const viewRecord = await tx.viewTracking.create({
        data: {
          userId: data.userId,
          clipId: data.clipId,
          views: BigInt(data.views),
          date: data.date,
          platform: data.platform as any,
        }
      })

      // Update clip total views
      await tx.clip.update({
        where: { id: data.clipId },
        data: {
          views: {
            increment: BigInt(data.views)
          }
        }
      })

      // Update user total views
      await tx.user.update({
        where: { id: data.userId },
        data: {
          totalViews: {
            increment: BigInt(data.views)
          }
        }
      })

      return viewRecord
    })
  })
}

/**
 * Admin campaign creation with validation
 */
export async function createCampaign(data: CampaignCreateData) {
  return safeDbOperation(async () => {
    // Validate required fields
    if (!data.title || !data.description || !data.creator) {
      throw new Error('Missing required campaign fields')
    }

    if (data.budget <= 0 || data.payoutRate <= 0) {
      throw new Error('Budget and payout rate must be positive')
    }

    return await prisma.campaign.create({
      data: {
        title: data.title,
        description: data.description,
        creator: data.creator,
        budget: new Prisma.Decimal(data.budget),
        payoutRate: new Prisma.Decimal(data.payoutRate),
        startDate: data.startDate,
        requirements: data.requirements || [],
        targetPlatforms: data.targetPlatforms || [] as SocialPlatform[],
        status: 'ACTIVE'
      }
    })
  })
}

/**
 * Get user statistics with error handling
 */
export async function getUserStats(userId: string) {
  return safeDbOperation(async () => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalEarnings: true,
        totalViews: true,
        verified: true,
        _count: {
          select: {
            clips: true,
            clipSubmissions: true,
            socialAccounts: {
              where: { verified: true }
            }
          }
        }
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    return {
      totalEarnings: user.totalEarnings.toNumber(),
      totalViews: Number(user.totalViews),
      verified: user.verified,
      clipCount: user._count.clips,
      submissionCount: user._count.clipSubmissions,
      verifiedAccountsCount: user._count.socialAccounts
    }
  })
}

/**
 * Batch update views for multiple clips
 * Useful for bulk view tracking operations
 */
export async function batchUpdateViews(viewUpdates: ViewTrackingData[]) {
  return safeDbOperation(async () => {
    return await prisma.$transaction(async (tx) => {
      const results = []
      
      for (const update of viewUpdates) {
        const result = await tx.viewTracking.create({
          data: {
            userId: update.userId,
            clipId: update.clipId,
            views: BigInt(update.views),
            date: update.date,
            platform: update.platform as any,
          }
        })
        results.push(result)
        
        // Update clip views
        await tx.clip.update({
          where: { id: update.clipId },
          data: {
            views: { increment: BigInt(update.views) }
          }
        })
      }
      
      return results
    })
  })
}

/**
 * Check database health
 * Useful for monitoring and debugging
 */
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'healthy', timestamp: new Date() }
  } catch (error: any) {
    return { 
      status: 'unhealthy', 
      error: error.message,
      timestamp: new Date() 
    }
  }
}
