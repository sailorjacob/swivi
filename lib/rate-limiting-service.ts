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
  
  // In-memory cache with TTL for fast lookups (backed by database for persistence)
  private memoryCache = new Map<string, { count: number; resetTime: number; lastSync: number }>()
  private readonly MEMORY_CACHE_TTL = 5000 // 5 seconds - sync with DB every 5s

  // Rate limit configurations for different endpoints
  private static readonly RATE_LIMITS: Record<string, RateLimitConfig> = {
    // Submission endpoints
    'submission:create': { windowMs: 60 * 1000, maxRequests: 10 }, // 10 per minute
    'submission:update': { windowMs: 60 * 1000, maxRequests: 20 }, // 20 per minute

    // View tracking endpoints
    'view-tracking:update': { windowMs: 5 * 60 * 1000, maxRequests: 5 }, // 5 per 5 minutes

    // Authentication endpoints
    'auth:login': { windowMs: 15 * 60 * 1000, maxRequests: 20 }, // 20 per 15 minutes
    'auth:register': { windowMs: 60 * 60 * 1000, maxRequests: 100 }, // 100 per hour per IP (for shared networks/launch day)

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
   * Uses database for distributed rate limiting across serverless instances
   */
  async checkRateLimit(
    identifier: string,
    endpoint: string,
    config?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    const rateLimitConfig = {
      ...RateLimitingService.RATE_LIMITS[endpoint],
      ...config
    }

    if (!rateLimitConfig || !rateLimitConfig.windowMs) {
      // No config found, allow request but log warning
      console.warn(`No rate limit configuration found for endpoint: ${endpoint}`)
      return {
        success: true,
        limit: 100,
        remaining: 99,
        resetTime: Date.now() + 60000
      }
    }

    const key = `${endpoint}:${identifier}`
    const now = Date.now()
    const windowStart = now - rateLimitConfig.windowMs

    try {
      // Try database-backed rate limiting first
      const result = await this.checkRateLimitDatabase(key, rateLimitConfig, now, windowStart)
      return result
    } catch (error) {
      // Fallback to memory-only if database fails (graceful degradation)
      console.warn('Database rate limiting failed, using memory fallback:', error)
      return this.checkRateLimitMemory(key, rateLimitConfig, now)
    }
  }

  /**
   * Database-backed rate limiting for distributed environments
   */
  private async checkRateLimitDatabase(
    key: string,
    config: RateLimitConfig,
    now: number,
    windowStart: number
  ): Promise<RateLimitResult> {
    // Check memory cache first for performance
    const cached = this.memoryCache.get(key)
    if (cached && (now - cached.lastSync) < this.MEMORY_CACHE_TTL) {
      // Use cached value if recent enough
      if (cached.resetTime <= now) {
        // Window expired, reset
        cached.count = 1
        cached.resetTime = now + config.windowMs
        cached.lastSync = now
      } else {
        cached.count++
      }

      if (cached.count > config.maxRequests) {
        return {
          success: false,
          limit: config.maxRequests,
          remaining: 0,
          resetTime: cached.resetTime
        }
      }

      return {
        success: true,
        limit: config.maxRequests,
        remaining: Math.max(0, config.maxRequests - cached.count),
        resetTime: cached.resetTime
      }
    }

    // Query database for rate limit data
    // Use CronJobLog table to track rate limits (repurposing for now to avoid migration)
    const recentRequests = await prisma.cronJobLog.count({
      where: {
        jobName: key,
        startedAt: {
          gte: new Date(windowStart)
        }
      }
    })

    const resetTime = now + config.windowMs

    if (recentRequests >= config.maxRequests) {
      // Update memory cache
      this.memoryCache.set(key, { count: recentRequests, resetTime, lastSync: now })
      
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime
      }
    }

    // Log this request for rate limiting
    await prisma.cronJobLog.create({
      data: {
        jobName: key,
        status: 'RATE_LIMIT_CHECK',
        startedAt: new Date(now),
        completedAt: new Date(now),
        duration: 0
      }
    })

    // Update memory cache
    this.memoryCache.set(key, { count: recentRequests + 1, resetTime, lastSync: now })

    // Cleanup old entries periodically (1% chance per request)
    if (Math.random() < 0.01) {
      this.cleanupOldRateLimitEntries(windowStart).catch(console.error)
    }

    return {
      success: true,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - recentRequests - 1),
      resetTime
    }
  }

  /**
   * Memory-only rate limiting fallback
   */
  private checkRateLimitMemory(
    key: string,
    config: RateLimitConfig,
    now: number
  ): RateLimitResult {
    let rateLimitData = this.memoryCache.get(key)

    if (!rateLimitData || rateLimitData.resetTime <= now) {
      rateLimitData = {
        count: 1,
        resetTime: now + config.windowMs,
        lastSync: now
      }
      this.memoryCache.set(key, rateLimitData)
    } else {
      rateLimitData.count++
    }

    if (rateLimitData.count > config.maxRequests) {
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime: rateLimitData.resetTime
      }
    }

    return {
      success: true,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - rateLimitData.count),
      resetTime: rateLimitData.resetTime
    }
  }

  /**
   * Cleanup old rate limit entries from database
   */
  private async cleanupOldRateLimitEntries(windowStart: number): Promise<void> {
    try {
      await prisma.cronJobLog.deleteMany({
        where: {
          status: 'RATE_LIMIT_CHECK',
          startedAt: {
            lt: new Date(windowStart - 3600000) // Clean entries older than 1 hour past window
          }
        }
      })
    } catch (error) {
      console.error('Error cleaning up rate limit entries:', error)
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
      console.warn(`🚨 Rate limit violation: ${identifier} on ${endpoint}`, {
        userAgent,
        ipAddress,
        timestamp: new Date().toISOString()
      })

      // Log to database for monitoring
      await prisma.cronJobLog.create({
        data: {
          jobName: `violation:${endpoint}:${identifier}`,
          status: 'RATE_LIMIT_VIOLATION',
          startedAt: new Date(),
          completedAt: new Date(),
          duration: 0,
          details: {
            identifier,
            endpoint,
            userAgent,
            ipAddress
          }
        }
      })

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
      let fraudAction: 'allow' | 'flag' | 'block' = 'allow'
      if (riskScore >= 70) {
        fraudAction = 'block'
      } else if (riskScore >= 40) {
        fraudAction = 'flag'
      }

      return {
        isSuspicious: riskScore >= 20,
        riskScore,
        reasons,
        action: fraudAction
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
        ...submissions.map(s => ({ action: 'submission', timestamp: s.createdAt! })),
        ...payouts.map(p => ({ action: 'payout_request', timestamp: p.createdAt! })),
        ...verifications.map(v => ({ action: 'verification', timestamp: v.createdAt! }))
      ]

    } catch (error) {
      console.error('Error getting user activity:', error)
      return []
    }
  }

  /**
   * Get rate limit statistics for monitoring
   */
  async getRateLimitStats(): Promise<{
    totalChecks: number
    violations: number
    topEndpoints: Array<{ endpoint: string; count: number }>
  }> {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

      const [totalChecks, violations] = await Promise.all([
        prisma.cronJobLog.count({
          where: {
            status: 'RATE_LIMIT_CHECK',
            startedAt: { gte: oneDayAgo }
          }
        }),
        prisma.cronJobLog.count({
          where: {
            status: 'RATE_LIMIT_VIOLATION',
            startedAt: { gte: oneDayAgo }
          }
        })
      ])

      return {
        totalChecks,
        violations,
        topEndpoints: [] // Would need groupBy for this
      }
    } catch (error) {
      console.error('Error getting rate limit stats:', error)
      return { totalChecks: 0, violations: 0, topEndpoints: [] }
    }
  }
}
