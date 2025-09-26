/**
 * Browser Session Management for Social Media Verification
 * Stores and reuses login cookies to avoid captchas and repeated logins
 */

interface StoredSession {
  platform: string
  cookies: any[]
  lastUsed: Date
  expiresAt: Date
  userAgent: string
}

// In-memory session storage (for serverless)
// In production, you'd use Redis, Database, or file storage
const sessionStore = new Map<string, StoredSession>()

export class BrowserSessionManager {
  private static readonly SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days
  private static readonly USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

  /**
   * Get stored session for a platform
   */
  static async getSession(platform: string): Promise<StoredSession | null> {
    const sessionKey = `${platform}_session`
    const session = sessionStore.get(sessionKey)
    
    if (!session) {
      console.log(`📝 No stored session found for ${platform}`)
      return null
    }

    // Check if session is expired
    if (new Date() > session.expiresAt) {
      console.log(`⏰ Session expired for ${platform}, removing`)
      sessionStore.delete(sessionKey)
      return null
    }

    console.log(`✅ Found valid session for ${platform}, last used: ${session.lastUsed}`)
    
    // Update last used timestamp
    session.lastUsed = new Date()
    sessionStore.set(sessionKey, session)
    
    return session
  }

  /**
   * Store session cookies for a platform
   */
  static async storeSession(platform: string, cookies: any[]): Promise<void> {
    const sessionKey = `${platform}_session`
    const session: StoredSession = {
      platform,
      cookies,
      lastUsed: new Date(),
      expiresAt: new Date(Date.now() + this.SESSION_DURATION),
      userAgent: this.USER_AGENT
    }

    sessionStore.set(sessionKey, session)
    console.log(`💾 Stored session for ${platform} with ${cookies.length} cookies`)
  }

  /**
   * Clear session for a platform
   */
  static async clearSession(platform: string): Promise<void> {
    const sessionKey = `${platform}_session`
    sessionStore.delete(sessionKey)
    console.log(`🗑️ Cleared session for ${platform}`)
  }

  /**
   * Apply stored cookies to a page
   */
  static async applyCookies(page: any, session: StoredSession): Promise<void> {
    if (!session.cookies || session.cookies.length === 0) {
      console.log(`⚠️ No cookies to apply for ${session.platform}`)
      return
    }

    try {
      await page.setCookie(...session.cookies)
      console.log(`🍪 Applied ${session.cookies.length} cookies for ${session.platform}`)
    } catch (error) {
      console.error(`❌ Failed to apply cookies for ${session.platform}:`, error)
      throw error
    }
  }

  /**
   * Get all cookies from a page and filter relevant ones
   */
  static async extractCookies(page: any, platform: string): Promise<any[]> {
    try {
      const allCookies = await page.cookies()
      
      // Filter to keep only relevant cookies for the platform
      const relevantCookies = allCookies.filter((cookie: any) => {
        const domain = cookie.domain
        
        switch (platform) {
          case 'twitter':
            return domain.includes('twitter.com') || domain.includes('x.com')
          case 'instagram':
            return domain.includes('instagram.com') || domain.includes('facebook.com')
          case 'youtube':
            return domain.includes('youtube.com') || domain.includes('google.com')
          case 'tiktok':
            return domain.includes('tiktok.com')
          default:
            return true
        }
      })

      console.log(`🍪 Extracted ${relevantCookies.length} relevant cookies for ${platform}`)
      return relevantCookies
    } catch (error) {
      console.error(`❌ Failed to extract cookies for ${platform}:`, error)
      return []
    }
  }

  /**
   * Check if we need to login by testing a protected page
   */
  static async needsLogin(page: any, platform: string): Promise<boolean> {
    try {
      let testUrl: string
      let loginIndicators: string[]

      switch (platform) {
        case 'twitter':
          testUrl = 'https://x.com/home'
          loginIndicators = ['Sign in', 'Log in', 'login', '/i/flow/login']
          break
        case 'instagram':
          testUrl = 'https://www.instagram.com/'
          loginIndicators = ['Log In', 'Sign up', 'login', '/accounts/login']
          break
        case 'youtube':
          testUrl = 'https://www.youtube.com/'
          loginIndicators = ['Sign in', 'sign_in', 'signin']
          break
        case 'tiktok':
          testUrl = 'https://www.tiktok.com/'
          loginIndicators = ['Log in', 'Sign up', 'login']
          break
        default:
          return true
      }

      console.log(`🔍 Testing if login needed for ${platform} at ${testUrl}`)
      
      await page.goto(testUrl, { waitUntil: 'networkidle2', timeout: 15000 })
      await page.waitForTimeout(3000)

      const pageContent = await page.content()
      const currentUrl = page.url()

      // Check for login indicators in page content or URL
      const needsLogin = loginIndicators.some(indicator => 
        pageContent.toLowerCase().includes(indicator.toLowerCase()) ||
        currentUrl.toLowerCase().includes(indicator.toLowerCase())
      )

      console.log(`🔐 Login needed for ${platform}: ${needsLogin ? 'YES' : 'NO'}`)
      return needsLogin
    } catch (error) {
      console.error(`❌ Error checking login status for ${platform}:`, error)
      return true // Assume login needed on error
    }
  }

  /**
   * Initialize browser page with session management
   */
  static async initializePageWithSession(browser: any, platform: string): Promise<{ page: any, needsLogin: boolean }> {
    const page = await browser.newPage()
    
    // Set consistent user agent
    await page.setUserAgent(this.USER_AGENT)
    await page.setViewport({ width: 1280, height: 720 })

    // Try to use stored session
    const storedSession = await this.getSession(platform)
    
    if (storedSession) {
      console.log(`🔄 Attempting to reuse session for ${platform}`)
      
      // Apply stored cookies
      await this.applyCookies(page, storedSession)
      
      // Test if we're actually logged in
      const needsLogin = await this.needsLogin(page, platform)
      
      if (!needsLogin) {
        console.log(`✅ Successfully reused session for ${platform}`)
        return { page, needsLogin: false }
      } else {
        console.log(`❌ Stored session invalid for ${platform}, need fresh login`)
        await this.clearSession(platform)
      }
    }

    return { page, needsLogin: true }
  }

  /**
   * Save session after successful login
   */
  static async saveSessionAfterLogin(page: any, platform: string): Promise<void> {
    console.log(`💾 Saving session for ${platform} after successful login`)
    
    // Extract and store cookies
    const cookies = await this.extractCookies(page, platform)
    await this.storeSession(platform, cookies)
  }

  /**
   * Get session statistics
   */
  static getSessionStats(): { platform: string, lastUsed: Date, expiresAt: Date }[] {
    return Array.from(sessionStore.entries()).map(([key, session]) => ({
      platform: session.platform,
      lastUsed: session.lastUsed,
      expiresAt: session.expiresAt
    }))
  }
}
