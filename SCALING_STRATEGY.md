# Production Scaling Strategy
## Handling Hundreds of Videos Across Multiple Campaigns

### Current System Capacity

**Current Configuration:**
- Cron frequency: Every 4 hours (6x per day)
- Batch size: 100 clips per run
- Timeout: 60 seconds per Apify actor
- Max daily capacity: ~600 clip tracking operations

**Bottlenecks to Address:**
1. **Vercel Function Timeout:** 10s (Hobby) / 60s (Pro) / 300s (Enterprise)
2. **Apify Rate Limits:** Depends on plan (free: 5K/month, paid: 100K+/month)
3. **Database Connections:** Supabase connection pooling limits
4. **Concurrent Scraping:** 100 clips × 60s = potential 100-minute runtime (too long!)

---

## Scaling Plan for 100-500 Clips Per Week

### 1. Batched Concurrent Processing with Limits

**Problem:** Running 100+ Apify actors concurrently will:
- Hit rate limits
- Timeout Vercel functions
- Overwhelm database

**Solution:** Process in controlled batches

```typescript
// lib/view-tracking-service.ts - UPDATED APPROACH

async processViewTracking(limit: number = 100): Promise<TrackingBatchResult> {
  const clipsNeedingTracking = await this.getClipsNeedingTracking(limit)
  
  // Process in smaller batches to avoid overwhelming Apify
  const BATCH_SIZE = 10 // Process 10 clips at a time
  const results: ViewTrackingResult[] = []
  
  for (let i = 0; i < clipsNeedingTracking.length; i += BATCH_SIZE) {
    const batch = clipsNeedingTracking.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.allSettled(
      batch.map(clip => this.trackClipViews(clip.id))
    )
    
    // Add results
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      }
    })
    
    // Small delay between batches to respect rate limits
    if (i + BATCH_SIZE < clipsNeedingTracking.length) {
      await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second pause
    }
  }
  
  return this.aggregateResults(results)
}
```

**Benefits:**
- Prevents overwhelming Apify API
- Stays within Vercel timeout limits
- Reduces memory usage
- More reliable

---

### 2. Smart Prioritization System

**Problem:** Not all clips need tracking every 4 hours

**Solution:** Prioritize based on campaign status and recency

```typescript
// lib/view-tracking-service.ts - SMART PRIORITIZATION

async getClipsNeedingTracking(limit: number = 100): Promise<Array<{
  id: string
  url: string
  platform: SocialPlatform
  lastTracked?: Date
  priority: number
}>> {
  const clips = await prisma.clip.findMany({
    where: {
      status: 'ACTIVE',
      clipSubmissions: {
        some: {
          campaigns: {
            status: 'ACTIVE'
          }
        }
      }
    },
    include: {
      view_tracking: {
        orderBy: { date: 'desc' },
        take: 1
      },
      clipSubmissions: {
        include: {
          campaigns: true
        }
      }
    },
    take: limit * 2 // Get more than we need for prioritization
  })

  // Calculate priority scores
  const scored = clips.map(clip => {
    const lastTracked = clip.view_tracking[0]?.date
    const hoursSinceTracking = lastTracked 
      ? (Date.now() - lastTracked.getTime()) / (1000 * 60 * 60)
      : 999
    
    // Priority factors:
    // - High: Never tracked (999 points)
    // - High: Not tracked in 8+ hours (2x base)
    // - High: New campaign (< 7 days old) (1.5x multiplier)
    // - Medium: Not tracked in 4-8 hours (1x base)
    // - Low: Tracked recently (0.5x base)
    
    let priority = hoursSinceTracking
    
    // Boost priority for new campaigns
    const newestCampaign = clip.clipSubmissions
      .map(s => s.campaigns.createdAt)
      .sort((a, b) => b.getTime() - a.getTime())[0]
    
    if (newestCampaign) {
      const campaignAgeDays = (Date.now() - newestCampaign.getTime()) / (1000 * 60 * 60 * 24)
      if (campaignAgeDays < 7) {
        priority *= 1.5 // Boost new campaigns
      }
    }
    
    return {
      id: clip.id,
      url: clip.url,
      platform: clip.platform,
      lastTracked,
      priority
    }
  })

  // Sort by priority (highest first) and return top N
  return scored
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit)
}
```

**Impact:**
- New submissions get tracked immediately
- Active campaigns get more frequent updates
- Older completed campaigns tracked less often
- Better use of API quota

---

### 3. Apify Cost & Rate Limit Management

**Current Usage Estimate (500 clips/week scenario):**
- 500 clips ÷ 7 days = ~71 clips/day
- 6 cron runs/day × 71 clips = 426 Apify requests/day
- **Monthly:** ~12,780 requests

**Apify Pricing:**
- **Free Tier:** 5,000 requests/month (~167/day) ⚠️ Not enough!
- **Starter:** $49/mo → 100,000 requests/month (~3,333/day) ✅ Sufficient
- **Team:** $499/mo → 1,000,000 requests/month ✅ Enterprise scale

**Optimization Strategies:**

1. **Cache Recent Scrapes** (reduce redundant calls)
```typescript
// Add to view-tracking-service.ts
private scrapeCache = new Map<string, { views: number, timestamp: number }>()
private CACHE_TTL = 3600000 // 1 hour

async scrapeWithCache(url: string, platform: SocialPlatform): Promise<number> {
  const cacheKey = `${platform}:${url}`
  const cached = this.scrapeCache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
    console.log(`📦 Using cached views for ${url}`)
    return cached.views
  }
  
  const scrapedData = await this.scraper.scrapeContent(url, platform)
  const views = scrapedData.views || 0
  
  this.scrapeCache.set(cacheKey, { views, timestamp: Date.now() })
  return views
}
```

2. **Use Cheaper Actors When Possible**
- Some Apify actors are faster/cheaper than others
- Test alternatives for each platform

3. **Adaptive Frequency**
- Track viral content more frequently
- Reduce frequency for low-engagement content

---

### 4. Database Optimization

**Current Indexes:** ✅ Already added
- `clip_submissions(campaignId, status)`
- `view_tracking(clipId, date)`
- `payout_requests(userId, status)`

**Additional Optimizations:**

```sql
-- Add composite index for common query
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clips_status_platform 
ON clips(status, platform) 
WHERE status = 'ACTIVE';

-- Add index for campaign lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_status_created 
ON campaigns(status, "createdAt" DESC) 
WHERE status = 'ACTIVE';

-- Partial index for recent tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_view_tracking_recent 
ON view_tracking("clipId", date DESC) 
WHERE date > NOW() - INTERVAL '30 days';
```

**Connection Pooling:**
```typescript
// prisma/schema.prisma - UPDATE datasource
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Add connection pooling for better performance
  connectionLimit = 10
}
```

---

### 5. Monitoring & Alerting System

**What to Track:**
1. Cron job success rate
2. Apify API usage
3. Average scraping time per platform
4. Failed clips (retry queue)
5. Campaign completion rate

**Implementation:**

```typescript
// lib/monitoring-service.ts - NEW FILE

import { prisma } from './prisma'

interface CronJobMetrics {
  timestamp: Date
  clipsProcessed: number
  clipsSuccessful: number
  clipsFailed: number
  averageDuration: number
  apifyCallsUsed: number
  earningsAdded: number
}

export class MonitoringService {
  async logCronExecution(metrics: CronJobMetrics) {
    // Store in database for historical tracking
    await prisma.cronLog.create({
      data: {
        type: 'VIEW_TRACKING',
        ...metrics,
        successRate: (metrics.clipsSuccessful / metrics.clipsProcessed) * 100
      }
    })
    
    // Alert if success rate drops below 80%
    const successRate = (metrics.clipsSuccessful / metrics.clipsProcessed) * 100
    if (successRate < 80) {
      await this.sendAlert({
        severity: 'WARNING',
        message: `View tracking success rate dropped to ${successRate.toFixed(1)}%`,
        metrics
      })
    }
    
    // Alert if Apify usage is high (approaching limit)
    if (metrics.apifyCallsUsed > 4000) { // 80% of free tier
      await this.sendAlert({
        severity: 'INFO',
        message: `Apify usage high this month: ${metrics.apifyCallsUsed} calls`,
        metrics
      })
    }
  }
  
  private async sendAlert(alert: {
    severity: 'INFO' | 'WARNING' | 'ERROR'
    message: string
    metrics: any
  }) {
    // Send to admin notification system
    console.error(`🚨 [${alert.severity}] ${alert.message}`)
    
    // TODO: Integrate with Discord/Slack webhook
    // TODO: Email admin
  }
  
  async getHealthStatus() {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    const recentLogs = await prisma.cronLog.findMany({
      where: {
        timestamp: { gte: last24h }
      }
    })
    
    const avgSuccessRate = recentLogs.reduce((sum, log) => 
      sum + (log.successRate || 0), 0
    ) / recentLogs.length
    
    return {
      status: avgSuccessRate > 90 ? 'HEALTHY' : avgSuccessRate > 70 ? 'DEGRADED' : 'UNHEALTHY',
      avgSuccessRate,
      totalRuns: recentLogs.length,
      lastRun: recentLogs[0]?.timestamp
    }
  }
}
```

**Add to cron job:**
```typescript
// app/api/cron/view-tracking/route.ts - UPDATE
const monitoring = new MonitoringService()

const result = await viewTrackingService.processViewTracking(100)

await monitoring.logCronExecution({
  timestamp: new Date(),
  clipsProcessed: result.processed,
  clipsSuccessful: result.successful,
  clipsFailed: result.failed,
  averageDuration: duration / result.processed,
  apifyCallsUsed: result.successful, // 1 call per success
  earningsAdded: result.totalEarningsAdded
})
```

---

### 6. Vercel Function Timeout Configuration

**Update `vercel.json`:**
```json
{
  "functions": {
    "app/api/cron/view-tracking/route.ts": {
      "maxDuration": 300
    }
  },
  "crons": [
    {
      "path": "/api/cron/view-tracking",
      "schedule": "0 */4 * * *"
    }
  ]
}
```

**Note:** `maxDuration: 300` (5 minutes) requires **Pro plan** or higher

**Hobby Plan Workaround:**
- Process fewer clips per run (30-50)
- Run cron more frequently (every 2 hours instead of 4)

---

### 7. Error Handling & Retry Strategy

**Robust Error Handling:**

```typescript
// lib/view-tracking-service.ts - ENHANCED ERROR HANDLING

async trackClipViews(clipId: string, retryCount: number = 0): Promise<ViewTrackingResult> {
  const MAX_RETRIES = 2
  
  try {
    // ... existing tracking logic ...
  } catch (error) {
    console.error(`Error tracking clip ${clipId} (attempt ${retryCount + 1}):`, error)
    
    // Retry logic for transient failures
    if (retryCount < MAX_RETRIES && this.isRetryableError(error)) {
      console.log(`Retrying clip ${clipId} in 5 seconds...`)
      await new Promise(resolve => setTimeout(resolve, 5000))
      return this.trackClipViews(clipId, retryCount + 1)
    }
    
    // Log persistent failure for manual review
    await this.logFailedClip(clipId, error)
    
    return {
      success: false,
      clipId,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

private isRetryableError(error: any): boolean {
  const retryableMessages = [
    'timeout',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'rate limit',
    'temporarily unavailable'
  ]
  
  const errorMessage = error?.message?.toLowerCase() || ''
  return retryableMessages.some(msg => errorMessage.includes(msg))
}

private async logFailedClip(clipId: string, error: any) {
  // Store failed clips for later retry or manual review
  await prisma.failedScrape.create({
    data: {
      clipId,
      error: error?.message || 'Unknown error',
      attemptedAt: new Date(),
      retryable: this.isRetryableError(error)
    }
  })
}
```

---

## Recommended Configuration for 500 Clips/Week

### Infrastructure Requirements

**Vercel Plan:**
- **Pro Plan ($20/mo)** ✅ Recommended
  - 60s function timeout (vs 10s hobby)
  - Better for batch processing
  - Commercial usage support

**Apify Plan:**
- **Starter ($49/mo)** ✅ Recommended for 500 clips/week
  - 100K requests/month
  - Plenty of headroom
  - Upgrade to Team if scaling to 1,000+/week

**Database:**
- **Supabase Pro ($25/mo)** if needed
  - 100 GB bandwidth
  - Connection pooling
  - Better for high-traffic scenarios

**Total Monthly Cost:** ~$95/mo for reliable production

---

### Cron Configuration

**Option A: Current (4-hour intervals)**
```json
{
  "crons": [
    {
      "path": "/api/cron/view-tracking",
      "schedule": "0 */4 * * *"
    }
  ]
}
```
- 6 runs per day
- 100 clips per run = 600 clips/day capacity
- ✅ Sufficient for 500/week (~71/day)

**Option B: More frequent (2-hour intervals)**
```json
{
  "crons": [
    {
      "path": "/api/cron/view-tracking",
      "schedule": "0 */2 * * *"
    }
  ]
}
```
- 12 runs per day
- 50 clips per run = 600 clips/day capacity
- ✅ More responsive, lower batch size

**Recommendation:** Start with Option A, switch to B if you need faster updates

---

### Processing Strategy

```typescript
// app/api/cron/view-tracking/route.ts - PRODUCTION CONFIG

export const maxDuration = 300 // 5 minutes (requires Pro plan)

export async function GET(request: NextRequest) {
  const viewTrackingService = new ViewTrackingService()
  const monitoring = new MonitoringService()
  
  // Process in batches of 10 to stay within limits
  const result = await viewTrackingService.processViewTrackingBatched({
    totalLimit: 100,      // Max clips per run
    batchSize: 10,        // Concurrent Apify calls
    batchDelay: 2000,     // 2s pause between batches
    prioritize: true      // Use smart prioritization
  })
  
  // Log metrics
  await monitoring.logCronExecution({
    timestamp: new Date(),
    clipsProcessed: result.processed,
    clipsSuccessful: result.successful,
    clipsFailed: result.failed,
    averageDuration: duration / result.processed,
    apifyCallsUsed: result.successful,
    earningsAdded: result.totalEarningsAdded
  })
  
  return NextResponse.json({ success: true, stats: result })
}
```

---

## Summary: Production Readiness Checklist

### ✅ Already Implemented
- [x] Database indexes for performance
- [x] 60-second Apify timeout
- [x] Integrated view tracking + earnings calculation
- [x] Campaign budget enforcement
- [x] Payout request system

### 🔄 Recommended Enhancements
- [ ] Batched processing (10 clips at a time)
- [ ] Smart prioritization system
- [ ] Monitoring & alerting service
- [ ] Retry logic for failed scrapes
- [ ] Scraping cache (reduce Apify calls)
- [ ] Additional database indexes
- [ ] Admin health dashboard
- [ ] Apify usage tracking

### 💰 Infrastructure Upgrades
- [ ] Upgrade to Vercel Pro ($20/mo) for 300s timeout
- [ ] Upgrade to Apify Starter ($49/mo) for 100K requests
- [ ] Consider Supabase Pro if database connections saturate

### 📊 Capacity Planning
**Current System (after optimizations):**
- **Daily:** 600 clips tracked
- **Weekly:** 4,200 clips tracked
- **Monthly:** ~18,000 clips tracked

**Scaling Path:**
- 500 clips/week = **well within capacity** ✅
- 1,000 clips/week = **comfortable with batching** ✅
- 2,000+ clips/week = **need faster cron or parallel jobs** ⚠️

---

## Next Steps

1. **Immediate (for 100-500 clips/week):**
   - Implement batched processing
   - Add monitoring service
   - Upgrade to Vercel Pro

2. **Short-term (1-2 weeks):**
   - Implement smart prioritization
   - Add retry logic
   - Set up alerting

3. **Long-term (if scaling to 1,000+/week):**
   - Consider queue-based architecture (BullMQ/Redis)
   - Separate worker processes
   - Real-time dashboard for admins

