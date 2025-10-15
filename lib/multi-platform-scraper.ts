import { ApifyTikTokScraper } from './apify-tiktok-scraper'
import { ApifyYouTubeScraper } from './apify-youtube-scraper'
import { ApifyInstagramScraper } from './apify-instagram-scraper'
import { ApifyTwitterScraper } from './apify-twitter-scraper'
import { SocialPlatform } from '@prisma/client'

export interface ScrapedContentData {
  platform: SocialPlatform
  url: string
  views?: number
  likes?: number
  comments?: number
  shares?: number
  followers?: number
  title?: string
  description?: string
  author?: string
  createdAt?: Date
  error?: string
}

export interface ApifyScraperResponse {
  // TikTok specific
  playCount?: number
  diggCount?: number
  shareCount?: number
  commentCount?: number
  collectCount?: number
  authorMeta?: {
    name: string
  }
  text?: string
  createTimeISO?: string
  videoMeta?: {
    duration?: number
  }
  musicMeta?: {
    musicName?: string
    musicAuthor?: string
  }
  // YouTube specific
  viewCount?: number
  likeCount?: number
  subscriberCount?: number
  title?: string
  description?: string
  channelTitle?: string
  publishedAt?: string
  // Twitter specific
  retweetCount?: number
  replyCount?: number
  quoteCount?: number
  bookmarkCount?: number
  user?: {
    username: string
    name: string
    followersCount: number
  }
  createdAt?: string
  // Instagram specific
  ownerUsername?: string
  ownerFullName?: string
  ownerFollowersCount?: number
  caption?: string
  timestamp?: string
  videoViewCount?: number
  videoPlayCount?: number
  instagramLikeCount?: number
  instagramCommentCount?: number
  instagramShareCount?: number
}

export class MultiPlatformScraper {
  private apifyToken: string
  private scrapers: Map<SocialPlatform, any> = new Map()

  constructor(apifyToken: string) {
    this.apifyToken = apifyToken
    this.initializeScrapers()
  }

  private initializeScrapers() {
    // Initialize all platform scrapers
    this.scrapers.set('TIKTOK', new ApifyTikTokScraper(this.apifyToken))
    this.scrapers.set('YOUTUBE', new ApifyYouTubeScraper(this.apifyToken))
    this.scrapers.set('INSTAGRAM', new ApifyInstagramScraper(this.apifyToken))
    this.scrapers.set('TWITTER', new ApifyTwitterScraper(this.apifyToken))
  }

  /**
   * Scrapes content from any supported platform
   */
  async scrapeContent(url: string, platform: SocialPlatform): Promise<ScrapedContentData> {
    try {
      const scraper = this.scrapers.get(platform)

      if (!scraper) {
        throw new Error(`Scraper not available for platform: ${platform}`)
      }

      let rawData: ApifyScraperResponse

      switch (platform) {
        case 'TIKTOK':
          rawData = await scraper.scrapeTikTokVideo(url)
          break

        case 'YOUTUBE':
          rawData = await this.scrapeYouTubeVideo(url)
          break

        case 'TWITTER':
          rawData = await this.scrapeTwitterPost(url)
          break

        case 'INSTAGRAM':
          rawData = await this.scrapeInstagramPost(url)
          break

        default:
          throw new Error(`Unsupported platform: ${platform}`)
      }

      return this.transformRawData(rawData, platform, url)

    } catch (error) {
      console.error(`Error scraping ${platform} content from ${url}:`, error)
      return {
        platform,
        url,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Scrapes multiple URLs concurrently across different platforms
   */
  async scrapeMultipleContent(items: Array<{ url: string; platform: SocialPlatform }>): Promise<ScrapedContentData[]> {
    const promises = items.map(item => this.scrapeContent(item.url, item.platform))
    return Promise.allSettled(promises).then(results =>
      results.map(result =>
        result.status === 'fulfilled' ? result.value : {
          platform: 'TIKTOK', // fallback
          url: '',
          error: result.reason?.message || 'Scraping failed'
        }
      )
    )
  }

  /**
   * YouTube scraper using Apify
   */
  private async scrapeYouTubeVideo(url: string): Promise<ApifyScraperResponse> {
    const scraper = this.scrapers.get('YOUTUBE') as ApifyYouTubeScraper
    if (!scraper) {
      throw new Error('YouTube scraper not initialized')
    }
    return scraper.scrapeYouTubeVideo(url)
  }

  /**
   * Twitter/X scraper using Apify
   */
  private async scrapeTwitterPost(url: string): Promise<ApifyScraperResponse> {
    const scraper = this.scrapers.get('TWITTER') as ApifyTwitterScraper
    if (!scraper) {
      throw new Error('Twitter scraper not initialized')
    }
    return scraper.scrapeTwitterPost(url)
  }

  /**
   * Instagram scraper using Apify
   */
  private async scrapeInstagramPost(url: string): Promise<ApifyScraperResponse> {
    const scraper = this.scrapers.get('INSTAGRAM') as ApifyInstagramScraper
    if (!scraper) {
      throw new Error('Instagram scraper not initialized')
    }
    return scraper.scrapeInstagramPost(url)
  }

  /**
   * Transforms raw Apify data into standardized format
   */
  private transformRawData(rawData: any, platform: SocialPlatform, url: string): ScrapedContentData {
    const baseData = {
      platform,
      url
    }

    switch (platform) {
      case 'TIKTOK':
        return {
          ...baseData,
          views: rawData.playCount,
          likes: rawData.diggCount,
          comments: rawData.commentCount,
          shares: rawData.shareCount,
          author: rawData['authorMeta.name'],
          title: rawData.text,
          createdAt: rawData.createTimeISO ? new Date(rawData.createTimeISO) : undefined
        }

      case 'YOUTUBE':
        return {
          ...baseData,
          views: rawData.viewCount,
          likes: rawData.likes,
          title: rawData.title,
          author: rawData.channelName,
          createdAt: rawData.date ? new Date(rawData.date) : undefined
        }

      case 'TWITTER':
        return {
          ...baseData,
          views: rawData.viewCount || 0,
          likes: rawData.likeCount,
          comments: rawData.replyCount,
          shares: rawData.retweetCount,
          author: rawData.user?.name,
          title: rawData.text,
          createdAt: rawData.createdAt ? new Date(rawData.createdAt) : undefined
        }

      case 'INSTAGRAM':
        return {
          ...baseData,
          views: rawData.videoViewCount || rawData.videoPlayCount,
          likes: rawData.likesCount,
          comments: rawData.commentsCount,
          shares: 0, // Instagram doesn't provide share count in this format
          author: rawData.ownerFullName,
          title: rawData.caption,
          createdAt: rawData.timestamp ? new Date(rawData.timestamp) : undefined
        }

      default:
        return baseData
    }
  }

  /**
   * Gets all supported platforms
   */
  getSupportedPlatforms(): SocialPlatform[] {
    return Array.from(this.scrapers.keys())
  }

  /**
   * Checks if a platform is supported
   */
  isPlatformSupported(platform: SocialPlatform): boolean {
    return this.scrapers.has(platform)
  }
}
