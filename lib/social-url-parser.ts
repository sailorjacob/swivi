import { SocialPlatform } from '@prisma/client'

export interface ParsedSocialUrl {
  platform: SocialPlatform
  username?: string
  postId?: string
  isValid: boolean
  error?: string
}

/**
 * Parses social media URLs to extract platform, username, and post information
 */
export class SocialUrlParser {
  private static readonly URL_PATTERNS = {
    TIKTOK: [
      /^https?:\/\/(www\.)?tiktok\.com\/@([^\/\?#]+)\/video\/([^\/\?#]+)/i,
      /^https?:\/\/(www\.)?tiktok\.com\/t\/([^\/\?#]+)/i, // Short share links
      /^https?:\/\/vm\.tiktok\.com\/([^\/\?#]+)/i, // Mobile short links
      /^https?:\/\/(www\.)?tiktok\.com\/@([^\/\?#]+)\/?$/i,
      /^https?:\/\/(www\.)?tiktok\.com\/([^\/\?#]+)\/?$/i
    ],
    INSTAGRAM: [
      /^https?:\/\/(www\.)?instagram\.com\/reel\/([^\/\?#]+)/i,
      /^https?:\/\/(www\.)?instagram\.com\/p\/([^\/\?#]+)/i,
      /^https?:\/\/(www\.)?instagram\.com\/([^\/\?#]+)\/?$/i
    ],
    YOUTUBE: [
      /^https?:\/\/(www\.)?youtube\.com\/shorts\/([^\/\?#]+)/i,
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=([^&\?#]+)/i,
      /^https?:\/\/(www\.)?youtube\.com\/channel\/([^\/\?#]+)/i,
      /^https?:\/\/(www\.)?youtube\.com\/c\/([^\/\?#]+)/i,
      /^https?:\/\/(www\.)?youtube\.com\/([^\/\?#]+)\/?$/i,
      /^https?:\/\/youtu\.be\/([^\/\?#]+)/i
    ],
    TWITTER: [
      /^https?:\/\/(www\.)?x\.com\/([^\/\?#]+)\/status\/([^\/\?#]+)/i,
      /^https?:\/\/(www\.)?twitter\.com\/([^\/\?#]+)\/status\/([^\/\?#]+)/i,
      /^https?:\/\/(www\.)?x\.com\/([^\/\?#]+)\/?$/i,
      /^https?:\/\/(www\.)?twitter\.com\/([^\/\?#]+)\/?$/i
    ]
  }

  /**
   * Parses a social media URL and returns platform, username, and validation info
   */
  static parseUrl(url: string): ParsedSocialUrl {
    if (!url || typeof url !== 'string') {
      return {
        platform: 'TIKTOK',
        isValid: false,
        error: 'Invalid URL provided'
      }
    }

    // Clean up the URL
    const cleanUrl = url.trim()

    for (const [platform, patterns] of Object.entries(this.URL_PATTERNS)) {
      for (const pattern of patterns) {
        const match = cleanUrl.match(pattern)
        if (match) {
          return this.extractInfoFromMatch(platform as SocialPlatform, match, cleanUrl)
        }
      }
    }

    return {
      platform: 'TIKTOK',
      isValid: false,
      error: 'Unsupported or invalid social media URL'
    }
  }

  /**
   * Extracts platform-specific information from regex match
   */
  private static extractInfoFromMatch(
    platform: SocialPlatform,
    match: RegExpMatchArray,
    originalUrl: string
  ): ParsedSocialUrl {
    switch (platform) {
      case 'TIKTOK':
        return this.parseTikTokMatch(match, originalUrl)

      case 'INSTAGRAM':
        return this.parseInstagramMatch(match, originalUrl)

      case 'YOUTUBE':
        return this.parseYouTubeMatch(match, originalUrl)

      case 'TWITTER':
        return this.parseTwitterMatch(match, originalUrl)

      default:
        return {
          platform,
          isValid: false,
          error: 'Platform not supported'
        }
    }
  }

  private static parseTikTokMatch(match: RegExpMatchArray, url: string): ParsedSocialUrl {
    // TikTok patterns:
    // Pattern 0: https://tiktok.com/@username/video/123 -> match[2]=username, match[3]=videoId
    // Pattern 1: https://tiktok.com/t/ABC123 -> match[2]=shortCode
    // Pattern 2: https://vm.tiktok.com/ABC123 -> match[1]=shortCode
    // Pattern 3: https://tiktok.com/@username -> match[2]=username
    // Pattern 4: https://tiktok.com/username -> match[2]=username

    // Check for @username/video/videoId pattern
    if (match[2] && match[3] && url.includes('/video/')) {
      return {
        platform: 'TIKTOK',
        username: match[2].replace('@', ''),
        postId: match[3],
        isValid: true
      }
    }
    
    // Check for /t/ short links (e.g., https://www.tiktok.com/t/ZTMCocrA5/)
    if (url.includes('/t/') && match[2]) {
      return {
        platform: 'TIKTOK',
        postId: match[2], // Short code is the post identifier
        isValid: true
      }
    }
    
    // Check for vm.tiktok.com short links
    if (url.includes('vm.tiktok.com') && match[1]) {
      return {
        platform: 'TIKTOK',
        postId: match[1],
        isValid: true
      }
    }
    
    // Check for @username profile links
    if (match[2] && !url.includes('/video/')) {
      return {
        platform: 'TIKTOK',
        username: match[2].replace('@', ''),
        isValid: true
      }
    }
    
    // Fallback for other username patterns
    if (match[2]) {
      return {
        platform: 'TIKTOK',
        username: match[2],
        isValid: true
      }
    }

    return {
      platform: 'TIKTOK',
      isValid: false,
      error: 'Could not parse TikTok URL'
    }
  }

  private static parseInstagramMatch(match: RegExpMatchArray, url: string): ParsedSocialUrl {
    // Instagram patterns:
    // 0: https://instagram.com/reel/123
    // 1: https://instagram.com/p/123
    // 2: https://instagram.com/username

    if (match[2]) { // reel/123 or p/123 pattern
      return {
        platform: 'INSTAGRAM',
        postId: match[2],
        isValid: true
      }
    } else if (match[1]) { // username pattern
      return {
        platform: 'INSTAGRAM',
        username: match[1],
        isValid: true
      }
    }

    return {
      platform: 'INSTAGRAM',
      isValid: false,
      error: 'Could not parse Instagram URL'
    }
  }

  private static parseYouTubeMatch(match: RegExpMatchArray, url: string): ParsedSocialUrl {
    // YouTube patterns:
    // 0: https://youtube.com/shorts/123
    // 1: https://youtube.com/watch?v=123
    // 2: https://youtube.com/channel/123
    // 3: https://youtube.com/c/123
    // 4: https://youtube.com/username
    // 5: https://youtu.be/123

    if (match[2]) { // shorts/123 pattern
      return {
        platform: 'YOUTUBE',
        postId: match[2],
        isValid: true
      }
    } else if (match[1]) { // watch?v=123 pattern
      return {
        platform: 'YOUTUBE',
        postId: match[1],
        isValid: true
      }
    } else if (match[0]?.includes('youtu.be')) { // youtu.be/123 pattern
      return {
        platform: 'YOUTUBE',
        postId: match[1],
        isValid: true
      }
    } else if (match[1]) { // username pattern
      return {
        platform: 'YOUTUBE',
        username: match[1],
        isValid: true
      }
    }

    return {
      platform: 'YOUTUBE',
      isValid: false,
      error: 'Could not parse YouTube URL'
    }
  }

  private static parseTwitterMatch(match: RegExpMatchArray, url: string): ParsedSocialUrl {
    // Twitter patterns:
    // 0: https://x.com/username/status/123
    // 1: https://twitter.com/username/status/123
    // 2: https://x.com/username
    // 3: https://twitter.com/username

    if (match[3]) { // status/123 pattern
      return {
        platform: 'TWITTER',
        username: match[2],
        postId: match[3],
        isValid: true
      }
    } else if (match[1]) { // username pattern
      return {
        platform: 'TWITTER',
        username: match[1],
        isValid: true
      }
    }

    return {
      platform: 'TWITTER',
      isValid: false,
      error: 'Could not parse Twitter URL'
    }
  }

  /**
   * Validates if a URL belongs to a supported platform
   */
  static isValidSocialUrl(url: string): boolean {
    return this.parseUrl(url).isValid
  }

  /**
   * Gets the platform from a URL
   */
  static getPlatformFromUrl(url: string): SocialPlatform | null {
    const parsed = this.parseUrl(url)
    return parsed.isValid ? parsed.platform : null
  }

  /**
   * Gets the username from a URL (if available)
   */
  static getUsernameFromUrl(url: string): string | null {
    const parsed = this.parseUrl(url)
    return parsed.isValid ? parsed.username || null : null
  }

  /**
   * Gets the post ID from a URL (if it's a post URL)
   */
  static getPostIdFromUrl(url: string): string | null {
    const parsed = this.parseUrl(url)
    return parsed.isValid ? parsed.postId || null : null
  }

  /**
   * Checks if a URL is a post/video URL (has postId) vs profile URL
   */
  static isPostUrl(url: string): boolean {
    const parsed = this.parseUrl(url)
    return parsed.isValid && !!parsed.postId
  }

  /**
   * Checks if a URL is a profile URL (has username but no postId)
   */
  static isProfileUrl(url: string): boolean {
    const parsed = this.parseUrl(url)
    return parsed.isValid && !!parsed.username && !parsed.postId
  }
}
