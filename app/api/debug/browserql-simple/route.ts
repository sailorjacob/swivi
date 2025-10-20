// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { BrowserQLClient } from "@/lib/browserql-client"

export async function POST(request: NextRequest) {
  try {
    const { platform, username } = await request.json()
    
    if (!platform || !username) {
      return NextResponse.json({ 
        error: "Missing platform or username" 
      }, { status: 400 })
    }

    const logs: string[] = []
    logs.push(`🤖 Testing BrowserQL for ${platform} @${username}`)

    const client = new BrowserQLClient()
    
    let profileUrl = ""
    let bioSelectors: string[] = []
    
    // Configure platform-specific settings
    switch (platform.toLowerCase()) {
      case 'twitter':
      case 'x':
        profileUrl = `https://x.com/${username}`
        bioSelectors = [
          '[data-testid="UserDescription"]',
          '[data-testid="UserBio"]'
        ]
        break
        
      case 'instagram':
        const instagramUsername = username.replace('@', '')
        profileUrl = `https://www.instagram.com/${instagramUsername}/`
        bioSelectors = [
          '.-vDIg span',
          'div.-vDIg'
        ]
        break
        
      case 'tiktok':
        const tiktokUsername = username.startsWith('@') ? username : `@${username}`
        profileUrl = `https://www.tiktok.com/${tiktokUsername}`
        bioSelectors = [
          '[data-e2e="user-bio"]',
          '[data-e2e="user-subtitle"]'
        ]
        break
        
      case 'youtube':
        profileUrl = `https://youtube.com/@${username}`
        bioSelectors = [
          'yt-formatted-string[slot="content"]',
          '#description-content'
        ]
        break
        
      default:
        return NextResponse.json({ 
          error: `Unsupported platform: ${platform}` 
        }, { status: 400 })
    }

    logs.push(`📍 Profile URL: ${profileUrl}`)
    
    // Test BrowserQL connection and basic page info
    const result = await client.getBasicPageInfo(profileUrl)
    logs.push(`📄 Page title: "${result.title}"`)
    logs.push(`📸 Screenshot: ${result.screenshot ? 'captured' : 'none'}`)

    // Try to extract bio content
    const bioResult = await client.extractBioContent(profileUrl, bioSelectors.slice(0, 2))
    logs.push(`📝 Bio texts found: ${bioResult.bioTexts.length}`)
    
    bioResult.bioTexts.forEach((text, index) => {
      logs.push(`📝 Bio ${index + 1}: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`)
    })

    return NextResponse.json({
      success: true,
      platform,
      username,
      profileUrl,
      pageTitle: result.title,
      bioTexts: bioResult.bioTexts,
      logs,
      screenshot: result.screenshot || bioResult.screenshot
    })

  } catch (error) {
    console.error('BrowserQL simple test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Test failed",
      logs: [`❌ Error: ${error instanceof Error ? error.message : String(error)}`]
    }, { status: 500 })
  }
}
