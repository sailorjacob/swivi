import { TwitterApi, TweetV2, UserV2 } from 'twitter-api-v2'

export interface XTweetMetrics {
  tweetId: string
  impressionCount: number
  likeCount: number
  retweetCount: number
  replyCount: number
  quoteCount: number
  bookmarkCount?: number
  url: string
  createdAt: string
  authorUsername: string
  text: string
}

export interface XApiConfig {
  apiKey: string
  apiSecret: string
  accessToken: string
  accessTokenSecret: string
  bearerToken: string
}

export class XApiClient {
  private client: TwitterApi
  private readOnlyClient: TwitterApi

  constructor(config: XApiConfig) {
    // Initialize with OAuth 1.0a for full access
    this.client = new TwitterApi({
      appKey: config.apiKey,
      appSecret: config.apiSecret,
      accessToken: config.accessToken,
      accessSecret: config.accessTokenSecret,
    })

    // Initialize read-only client with Bearer token for public metrics
    this.readOnlyClient = new TwitterApi(config.bearerToken)
  }

  /**
   * Extract tweet ID from various X/Twitter URL formats
   */
  private extractTweetId(url: string): string | null {
    try {
      // Handle various URL formats:
      // https://twitter.com/user/status/1234567890
      // https://x.com/user/status/1234567890
      // https://mobile.twitter.com/user/status/1234567890
      // https://www.twitter.com/user/status/1234567890
      
      const patterns = [
        /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/i,
        /(?:mobile\.)?(?:www\.)?(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/i,
        /status\/(\d+)/i,
        /\/(\d+)$/i
      ]

      for (const pattern of patterns) {
        const match = url.match(pattern)
        if (match && match[1]) {
          return match[1]
        }
      }

      // If it's already just a tweet ID
      if (/^\d+$/.test(url.trim())) {
        return url.trim()
      }

      return null
    } catch (error) {
      console.error('Error extracting tweet ID from URL:', url, error)
      return null
    }
  }

  /**
   * Fetch tweet metrics including view count (impression_count)
   */
  async getTweetMetrics(tweetUrl: string): Promise<XTweetMetrics | null> {
    try {
      const tweetId = this.extractTweetId(tweetUrl)
      
      if (!tweetId) {
        console.error('Could not extract tweet ID from URL:', tweetUrl)
        return null
      }

      console.log(`🔍 Fetching metrics for tweet ID: ${tweetId}`)

      // Use read-only client for public metrics
      const tweet = await this.readOnlyClient.v2.singleTweet(tweetId, {
        'tweet.fields': [
          'public_metrics',
          'created_at',
          'author_id',
          'text',
          'context_annotations'
        ],
        'user.fields': ['username', 'name', 'public_metrics'],
        expansions: ['author_id']
      })

      if (!tweet.data) {
        console.error('Tweet not found or not accessible:', tweetId)
        return null
      }

      const tweetData = tweet.data
      const author = tweet.includes?.users?.[0]

      if (!tweetData.public_metrics) {
        console.error('Public metrics not available for tweet:', tweetId)
        return null
      }

      const metrics: XTweetMetrics = {
        tweetId,
        impressionCount: tweetData.public_metrics.impression_count || 0,
        likeCount: tweetData.public_metrics.like_count || 0,
        retweetCount: tweetData.public_metrics.retweet_count || 0,
        replyCount: tweetData.public_metrics.reply_count || 0,
        quoteCount: tweetData.public_metrics.quote_count || 0,
        bookmarkCount: tweetData.public_metrics.bookmark_count || 0,
        url: tweetUrl,
        createdAt: tweetData.created_at || '',
        authorUsername: author?.username || 'unknown',
        text: tweetData.text || ''
      }

      console.log(`✅ Successfully fetched metrics for tweet ${tweetId}: ${metrics.impressionCount} impressions`)
      
      return metrics

    } catch (error: any) {
      console.error('Error fetching tweet metrics:', error)
      
      // Handle specific API errors
      if (error.code === 429) {
        console.error('Rate limit exceeded. Please wait before making more requests.')
      } else if (error.code === 401) {
        console.error('Unauthorized. Check your API credentials.')
      } else if (error.code === 404) {
        console.error('Tweet not found or not accessible.')
      }
      
      return null
    }
  }

  /**
   * Fetch metrics for multiple tweets with rate limiting
   */
  async getMultipleTweetMetrics(tweetUrls: string[]): Promise<(XTweetMetrics | null)[]> {
    const results: (XTweetMetrics | null)[] = []
    
    console.log(`🔄 Fetching metrics for ${tweetUrls.length} tweets...`)
    
    for (let i = 0; i < tweetUrls.length; i++) {
      const url = tweetUrls[i]
      
      try {
        const metrics = await this.getTweetMetrics(url)
        results.push(metrics)
        
        // Rate limiting: X API v2 allows 300 requests per 15 minutes for tweet lookup
        // That's about 1 request per 3 seconds to be safe
        if (i < tweetUrls.length - 1) {
          console.log(`⏳ Rate limiting: waiting 3 seconds before next request...`)
          await new Promise(resolve => setTimeout(resolve, 3000))
        }
        
      } catch (error) {
        console.error(`Error fetching metrics for URL ${url}:`, error)
        results.push(null)
      }
    }
    
    console.log(`✅ Completed fetching metrics for ${tweetUrls.length} tweets`)
    return results
  }

  /**
   * Test the API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const me = await this.readOnlyClient.v2.me()
      console.log('✅ X API connection successful. Authenticated as:', me.data?.username)
      return true
    } catch (error) {
      console.error('❌ X API connection failed:', error)
      return false
    }
  }

  /**
   * Get rate limit status
   */
  async getRateLimitStatus(): Promise<any> {
    try {
      const rateLimits = await this.readOnlyClient.v1.rateLimitStatuses()
      return rateLimits
    } catch (error) {
      console.error('Error getting rate limit status:', error)
      return null
    }
  }
}

// Factory function to create X API client with environment variables
export function createXApiClient(): XApiClient | null {
  try {
    const config: XApiConfig = {
      apiKey: process.env.X_API_KEY || '',
      apiSecret: process.env.X_API_SECRET || '',
      accessToken: process.env.X_ACCESS_TOKEN || '',
      accessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET || '',
      bearerToken: process.env.X_BEARER_TOKEN || ''
    }

    // Validate required credentials
    const requiredFields = ['apiKey', 'apiSecret', 'accessToken', 'accessTokenSecret', 'bearerToken']
    const missingFields = requiredFields.filter(field => !config[field as keyof XApiConfig])
    
    if (missingFields.length > 0) {
      console.error('❌ Missing X API credentials:', missingFields)
      return null
    }

    return new XApiClient(config)
  } catch (error) {
    console.error('❌ Error creating X API client:', error)
    return null
  }
}
