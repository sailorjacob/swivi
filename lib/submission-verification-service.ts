import { prisma } from '@/lib/prisma'
import { SocialUrlParser, ParsedSocialUrl } from '@/lib/social-url-parser'
import { SocialPlatform } from '@prisma/client'

export interface VerificationResult {
  isVerified: boolean
  reason?: string
  verifiedAccount?: {
    id: string
    username: string
    platform: SocialPlatform
  }
  requiresReview?: boolean
  reviewReason?: string
}

export interface VerificationCheck {
  userId: string
  clipUrl: string
  platform: SocialPlatform
}

/**
 * Service for verifying that submitted clips belong to user's verified accounts
 */
export class SubmissionVerificationService {
  /**
   * Verifies that a submitted URL belongs to one of the user's verified accounts
   */
  static async verifySubmissionOwnership(check: VerificationCheck): Promise<VerificationResult> {
    try {
      // Parse the submitted URL to extract username and platform info
      const parsedUrl = SocialUrlParser.parseUrl(check.clipUrl)

      if (!parsedUrl.isValid) {
        return {
          isVerified: false,
          reason: `Invalid URL format: ${parsedUrl.error}`,
          requiresReview: true,
          reviewReason: 'Invalid URL format'
        }
      }

      // Check if the URL is a post URL (has postId) or profile URL
      if (!parsedUrl.username && !parsedUrl.postId) {
        return {
          isVerified: false,
          reason: 'Could not extract username from URL',
          requiresReview: true,
          reviewReason: 'Cannot determine account ownership'
        }
      }

      // Get user's verified accounts for this platform
      const verifiedAccounts = await prisma.socialAccount.findMany({
        where: {
          userId: check.userId,
          platform: parsedUrl.platform,
          verified: true,
          connected: true
        },
        select: {
          id: true,
          username: true,
          platform: true,
          verifiedAt: true
        }
      })

      if (verifiedAccounts.length === 0) {
        return {
          isVerified: false,
          reason: `No verified ${parsedUrl.platform} accounts found for this user`,
          requiresReview: true,
          reviewReason: 'No verified accounts for this platform'
        }
      }

      // If it's a post URL, we need to verify the post belongs to a verified account
      if (parsedUrl.postId) {
        return await this.verifyPostOwnership(parsedUrl, verifiedAccounts)
      }

      // If it's a profile URL, check if the username matches a verified account
      if (parsedUrl.username) {
        return await this.verifyProfileOwnership(parsedUrl.username, parsedUrl.platform, verifiedAccounts)
      }

      return {
        isVerified: false,
        reason: 'Unable to verify account ownership',
        requiresReview: true,
        reviewReason: 'Cannot determine verification method'
      }

    } catch (error) {
      console.error('Error verifying submission ownership:', error)
      return {
        isVerified: false,
        reason: 'Verification service error',
        requiresReview: true,
        reviewReason: 'System error during verification'
      }
    }
  }

  /**
   * Verifies that a post belongs to one of the user's verified accounts
   * This involves scraping the post to get the actual author
   */
  private static async verifyPostOwnership(
    parsedUrl: ParsedSocialUrl,
    verifiedAccounts: Array<{ id: string; username: string; platform: SocialPlatform }>
  ): Promise<VerificationResult> {
    // For now, we'll implement a simpler approach:
    // Extract username from URL and check if it matches any verified account
    // In a more sophisticated implementation, we would scrape the post to verify authorship

    if (!parsedUrl.username) {
      // Try to scrape the post to get the author information
      return await this.scrapePostForAuthor(parsedUrl, verifiedAccounts)
    }

    // Check if the extracted username matches any verified account
    const matchingAccount = verifiedAccounts.find(
      account => account.username.toLowerCase() === parsedUrl.username?.toLowerCase()
    )

    if (matchingAccount) {
      return {
        isVerified: true,
        verifiedAccount: matchingAccount
      }
    }

    // Username doesn't match verified accounts - flag for review
    return {
      isVerified: false,
      reason: `Post appears to be from @${parsedUrl.username} but user only has verified accounts: ${verifiedAccounts.map(a => `@${a.username}`).join(', ')}`,
      requiresReview: true,
      reviewReason: 'Username mismatch with verified accounts'
    }
  }

  /**
   * Scrapes a post to verify the actual author
   */
  private static async scrapePostForAuthor(
    parsedUrl: ParsedSocialUrl,
    verifiedAccounts: Array<{ id: string; username: string; platform: SocialPlatform }>
  ): Promise<VerificationResult> {
    // This would use the MultiPlatformScraper to get post details
    // For now, we'll implement a placeholder that assumes URL-based verification

    // TODO: Implement actual scraping to verify post authorship
    // For production, this should scrape the post and compare the author with verified accounts

    return {
      isVerified: false,
      reason: 'Post authorship verification not yet implemented - requires scraping',
      requiresReview: true,
      reviewReason: 'Requires manual verification of post authorship'
    }
  }

  /**
   * Verifies that a profile URL matches a verified account
   */
  private static async verifyProfileOwnership(
    username: string,
    platform: SocialPlatform,
    verifiedAccounts: Array<{ id: string; username: string; platform: SocialPlatform }>
  ): Promise<VerificationResult> {
    const matchingAccount = verifiedAccounts.find(
      account => account.username.toLowerCase() === username.toLowerCase()
    )

    if (matchingAccount) {
      return {
        isVerified: true,
        verifiedAccount: matchingAccount
      }
    }

    return {
      isVerified: false,
      reason: `Profile @${username} is not in user's verified accounts: ${verifiedAccounts.map(a => `@${a.username}`).join(', ')}`,
      requiresReview: true,
      reviewReason: 'Profile not in verified accounts'
    }
  }

  /**
   * Gets all verified accounts for a user across all platforms
   */
  static async getUserVerifiedAccounts(userId: string) {
    return await prisma.socialAccount.findMany({
      where: {
        userId,
        verified: true,
        connected: true
      },
      select: {
        id: true,
        platform: true,
        username: true,
        displayName: true,
        verifiedAt: true,
        followers: true
      }
    })
  }

  /**
   * Checks if a user has any verified accounts for a specific platform
   */
  static async hasVerifiedAccountForPlatform(userId: string, platform: SocialPlatform): Promise<boolean> {
    const count = await prisma.socialAccount.count({
      where: {
        userId,
        platform,
        verified: true,
        connected: true
      }
    })
    return count > 0
  }

  /**
   * Validates that a user can submit content for a specific platform
   */
  static async validatePlatformAccess(userId: string, platform: SocialPlatform): Promise<{
    canSubmit: boolean
    reason?: string
  }> {
    const hasVerifiedAccount = await this.hasVerifiedAccountForPlatform(userId, platform)

    if (!hasVerifiedAccount) {
      return {
        canSubmit: false,
        reason: `No verified ${platform} account found. Please verify your ${platform} account first.`
      }
    }

    return { canSubmit: true }
  }
}
