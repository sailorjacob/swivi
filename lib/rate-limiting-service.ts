import { prisma } from './prisma'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (request: any) => string // Custom key generation
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
}

interface FraudDetectionResult {
  isSuspicious: boolean
  riskScore: number
  reasons: string[]
  action: 'allow' | 'flag' | 'block'
}

export class RateLimitingService {
  private static instance: RateLimitingService
  private rateLimitStore = new Map<string, { count: number; resetTime: number }>()

  // Rate limit configurations for different endpoints
  private static readonly RATE_LIMITS = {
    // Submission endpoints
    'submission:create': { windowMs: 60 * 1000, maxRequests: 10 }, // 10 per minute
    'submission:update': { windowMs: 60 * 1000, maxRequests: 20 }, // 20 per minute

    // View tracking endpoints
    'view-tracking:update': { windowMs: 5 * 60 * 1000, maxRequests: 5 }, // 5 per 5 minutes

    // Authentication endpoints
    'auth:login': { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 per 15 minutes
    'auth:register': { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 per hour

    // API endpoints
    'api:general': { windowMs: 60 * 1000, maxRequests: 100 }, // 100 per minute

    // Social verification
    'verification:request': { windowMs: 60 * 60 * 1000, maxRequests: 5 }, // 5 per hour
    'verification:verify': { windowMs: 5 * 60 * 1000, maxRequests: 10 }, // 10 per 5 minutes

    // Payout requests
    'payout:request': { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 per hour

    // Admin endpoints (more restrictive)
    'admin:general': { windowMs: 60 * 1000, maxRequests: 50 }, // 50 per minute
    'admin:submissions': { windowMs: 60 * 1000, maxRequests: 30 }, // 30 per minute
  }

  static getInstance(): RateLimitingService {
    if (!RateLimitingService.instance) {
      RateLimitingService.instance = new RateLimitingService()
    }
    return RateLimitingService.instance
  }

  /**
   * Checks if a request should be rate limited
   */
  async checkRateLimit(
    identifier: string,
    endpoint: string,
    config?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    const rateLimitConfig = {
      ...this.constructor['RATE_LIMITS'][endpoint],
      ...config
    }

    if (!rateLimitConfig) {
      throw new Error(`No rate limit configuration found for endpoint: ${endpoint}`)
    }

    const key = `${endpoint}:${identifier}`
    const now = Date.now()
    const windowStart = now - rateLimitConfig.windowMs

    // Clean up old entries periodically
    this.cleanupOldEntries()

    // Get current rate limit data
    let rateLimitData = this.rateLimitStore.get(key)

    if (!rateLimitData || rateLimitData.resetTime <= now) {
      // Reset or create new window
      rateLimitData = {
        count: 0,
        resetTime: now + rateLimitConfig.windowMs
      }
      this.rateLimitStore.set(key, rateLimitData)
    }

    // Check if limit exceeded
    if (rateLimitData.count >= rateLimitConfig.maxRequests) {
      return {
        success: false,
        limit: rateLimitConfig.maxRequests,
        remaining: 0,
        resetTime: rateLimitData.resetTime
      }
    }

    // Increment counter
    rateLimitData.count++

    return {
      success: true,
      limit: rateLimitConfig.maxRequests,
      remaining: Math.max(0, rateLimitConfig.maxRequests - rateLimitData.count),
      resetTime: rateLimitData.resetTime
    }
  }

  /**
   * Records a rate limit violation for monitoring
   */
  async recordViolation(
    identifier: string,
    endpoint: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<void> {
    try {
      // In a production system, you might want to store this in a separate table
      // or send to a logging service
      console.warn(`Rate limit violation: ${identifier} on ${endpoint}`, {
        userAgent,
        ipAddress,
        timestamp: new Date().toISOString()
      })

      // TODO: Implement persistent storage for monitoring rate limit violations
      // This could be used for fraud detection and user behavior analysis

    } catch (error) {
      console.error('Error recording rate limit violation:', error)
    }
  }

  /**
   * Detects potential fraud patterns in user behavior
   */
  async detectFraud(
    userId: string,
    action: string,
    metadata?: Record<string, any>
  ): Promise<FraudDetectionResult> {
    try {
      const reasons: string[] = []
      let riskScore = 0

      // Get user's recent activity
      const recentActivity = await this.getUserActivity(userId, 24 * 60 * 60 * 1000) // Last 24 hours

      // Check for rapid-fire submissions (potential bot behavior)
      const recentSubmissions = recentActivity.filter(a => a.action === 'submission')
      if (recentSubmissions.length > 50) { // More than 50 submissions in 24h
        reasons.push('High volume of submissions')
        riskScore += 30
      }

      // Check for suspicious submission patterns
      const submissionTimes = recentSubmissions.map(s => s.timestamp.getTime())
      if (submissionTimes.length > 10) {
        const intervals = []
        for (let i = 1; i < submissionTimes.length; i++) {
          intervals.push(submissionTimes[i] - submissionTimes[i - 1])
        }
        const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length

        if (avgInterval < 1000) { // Less than 1 second average interval
          reasons.push('Suspicious submission timing')
          riskScore += 50
        }
      }

      // Check for duplicate content (same URLs submitted multiple times)
      if (metadata?.clipUrl) {
        const duplicateSubmissions = await prisma.clipSubmission.count({
          where: {
            userId,
            clipUrl: metadata.clipUrl,
            createdAt: {
              gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
            }
          }
        })

        if (duplicateSubmissions > 1) {
          reasons.push('Duplicate content submission')
          riskScore += 20
        }
      }

      // Check for account age vs activity level
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true, verified: true }
      })

      if (user) {
        const accountAge = Date.now() - user.createdAt.getTime()
        const accountAgeHours = accountAge / (1000 * 60 * 60)

        if (accountAgeHours < 24 && recentSubmissions.length > 10) {
          reasons.push('New account with high activity')
          riskScore += 25
        }

        if (!user.verified && recentSubmissions.length > 5) {
          reasons.push('Unverified account with multiple submissions')
          riskScore += 15
        }
      }

      // Check for payout request patterns
      if (action === 'payout_request') {
        const recentPayouts = recentActivity.filter(a => a.action === 'payout_request')
        if (recentPayouts.length > 3) {
          reasons.push('Multiple payout requests')
          riskScore += 20
        }
      }

      // Determine action based on risk score
      let action: 'allow' | 'flag' | 'block' = 'allow'
      if (riskScore >= 70) {
        action = 'block'
      } else if (riskScore >= 40) {
        action = 'flag'
      }

      return {
        isSuspicious: riskScore >= 20,
        riskScore,
        reasons,
        action
      }

    } catch (error) {
      console.error('Error in fraud detection:', error)
      return {
        isSuspicious: false,
        riskScore: 0,
        reasons: [],
        action: 'allow'
      }
    }
  }

  /**
   * Gets user's recent activity for fraud detection
   */
  private async getUserActivity(userId: string, timeWindowMs: number): Promise<Array<{
    action: string
    timestamp: Date
    metadata?: any
  }>> {
    try {
      const cutoff = new Date(Date.now() - timeWindowMs)

      // In a production system, you might want to store activity in a separate table
      // For now, we'll derive activity from existing tables

      const [
        submissions,
        payouts,
        verifications
      ] = await Promise.all([
        prisma.clipSubmission.findMany({
          where: {
            userId,
            createdAt: { gte: cutoff }
          },
          select: { createdAt: true }
        }),
        prisma.payout.findMany({
          where: {
            userId,
            createdAt: { gte: cutoff }
          },
          select: { createdAt: true }
        }),
        prisma.socialVerification.findMany({
          where: {
            userId,
            createdAt: { gte: cutoff }
          },
          select: { createdAt: true }
        })
      ])

      return [
        ...submissions.map(s => ({ action: 'submission', timestamp: s.createdAt })),
        ...payouts.map(p => ({ action: 'payout_request', timestamp: p.createdAt })),
        ...verifications.map(v => ({ action: 'verification', timestamp: v.createdAt }))
      ]

    } catch (error) {
      console.error('Error getting user activity:', error)
      return []
    }
  }

  /**
   * Cleans up old rate limit entries to prevent memory leaks
   */
  private cleanupOldEntries(): void {
    const now = Date.now()
    for (const [key, data] of this.rateLimitStore.entries()) {
      if (data.resetTime <= now) {
        this.rateLimitStore.delete(key)
      }
    }
  }

  /**
   * Middleware function for Next.js API routes
   */
  static middleware(endpoint: string, config?: Partial<RateLimitConfig>) {
    return async (req: NextRequest, identifier?: string) => {
      const service = RateLimitingService.getInstance()
      const userIdentifier = identifier || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

      const result = await service.checkRateLimit(userIdentifier, endpoint, config)

      if (!result.success) {
        await service.recordViolation(userIdentifier, endpoint, req.headers.get('user-agent') || undefined)

        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            limit: result.limit,
            remaining: result.remaining,
            resetTime: result.resetTime
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': result.limit.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.resetTime.toString(),
              'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
            }
          }
        )
      }

      return null // Continue to next middleware/route handler
    }
  }
}
