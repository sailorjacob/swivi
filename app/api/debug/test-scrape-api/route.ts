// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { BrowserlessScrapeClient } from "@/lib/browserless-scrape"

export async function POST(request: NextRequest) {
  try {
    const { platform, username, code } = await request.json()
    
    if (!platform || !username) {
      return NextResponse.json({ 
        error: "Missing platform or username" 
      }, { status: 400 })
    }

    const logs: string[] = []
    logs.push(`🧪 Testing Browserless Scrape API`)
    logs.push(`🎯 Platform: ${platform}, Username: @${username}`)
    if (code) {
      logs.push(`🔍 Looking for code: ${code}`)
    }

    const client = new BrowserlessScrapeClient()
    
    let profileUrl = ""
    let bioSelectors: string[] = []
    
    // Configure platform-specific settings
    switch (platform.toLowerCase()) {
      case 'twitter':
      case 'x':
        profileUrl = `https://x.com/${username}`
        bioSelectors = [
          '[data-testid="UserDescription"]',
          '[data-testid="UserBio"]',
          'div[data-testid="UserDescription"] span',
          '[data-testid="UserProfileHeader_Items"] div[lang]',
          'div[role="tabpanel"] div[lang]'
        ]
        break
        
      case 'instagram':
        const instagramUsername = username.replace('@', '')
        profileUrl = `https://www.instagram.com/${instagramUsername}/`
        bioSelectors = [
          '.-vDIg span',
          'div.-vDIg', 
          'header section div div span',
          'div[data-testid="ig-bio"]',
          'article header div span',
          'section main article header section div span',
          'h1 + div span'
        ]
        break
        
      case 'tiktok':
        const tiktokUsername = username.startsWith('@') ? username : `@${username}`
        profileUrl = `https://www.tiktok.com/${tiktokUsername}`
        bioSelectors = [
          '[data-e2e="user-bio"]',
          '[data-e2e="user-subtitle"]', 
          '.user-bio',
          'h2[data-e2e="user-subtitle"]',
          'div[data-e2e="user-bio-text"]',
          '.user-subtitle',
          '[data-testid="user-bio"]'
        ]
        break
        
      case 'youtube':
        profileUrl = `https://youtube.com/@${username}`
        bioSelectors = [
          'yt-formatted-string[slot="content"]',
          '#description-content',
          'ytd-channel-about-metadata-renderer',
          '#description yt-formatted-string',
          'yt-about-channel-renderer #description'
        ]
        break
        
      default:
        return NextResponse.json({ 
          error: `Unsupported platform: ${platform}` 
        }, { status: 400 })
    }

    logs.push(`📍 Profile URL: ${profileUrl}`)
    logs.push(`🎯 Bio selectors: ${bioSelectors.length} patterns`)

    // Test the scrape API
    const result = await client.scrapeProfile(profileUrl, bioSelectors)
    
    // Add scrape logs to our logs
    logs.push(...result.logs)
    
    // Combine all bio texts
    let bio = result.bioTexts.join(' ').trim()
    
    if (bio) {
      logs.push(`📝 Combined bio text: "${bio.substring(0, 300)}${bio.length > 300 ? '...' : ''}"`)
    } else {
      logs.push("⚠️ No bio text extracted from any selectors")
    }

    // Search for code if provided
    let codeFound = false
    if (code && bio) {
      codeFound = bio.toLowerCase().includes(code.toLowerCase())
      logs.push(`🔍 Code search result: ${codeFound ? '✅ FOUND' : '❌ NOT FOUND'}`)
    }

    return NextResponse.json({
      success: true,
      platform,
      username,
      code: code || null,
      profileUrl,
      bioTexts: result.bioTexts,
      combinedBio: bio,
      codeFound: code ? codeFound : null,
      logs,
      screenshot: result.screenshot
    })

  } catch (error) {
    console.error('Scrape API test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Test failed",
      logs: [`❌ Error: ${error instanceof Error ? error.message : String(error)}`]
    }, { status: 500 })
  }
}
