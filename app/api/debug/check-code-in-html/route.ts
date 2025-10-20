// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { BrowserQLClient } from "@/lib/browserql-client"

export async function POST(request: NextRequest) {
  try {
    const { platform, username, code } = await request.json()
    
    if (!platform || !username || !code) {
      return NextResponse.json({ 
        error: "Missing platform, username, or code" 
      }, { status: 400 })
    }

    const logs: string[] = []
    logs.push(`🔍 Checking if code "${code}" exists in ${platform} @${username}`)

    const client = new BrowserQLClient()
    
    let profileUrl = ""
    switch (platform.toLowerCase()) {
      case 'twitter':
      case 'x':
        profileUrl = `https://x.com/${username}`
        break
      case 'instagram':
        const instagramUsername = username.replace('@', '')
        profileUrl = `https://www.instagram.com/${instagramUsername}/`
        break
      case 'tiktok':
        const tiktokUsername = username.startsWith('@') ? username : `@${username}`
        profileUrl = `https://www.tiktok.com/${tiktokUsername}`
        break
      case 'youtube':
        profileUrl = `https://youtube.com/@${username}`
        break
      default:
        return NextResponse.json({ 
          error: `Unsupported platform: ${platform}` 
        }, { status: 400 })
    }

    logs.push(`📍 Profile URL: ${profileUrl}`)
    
    // Get full page HTML
    const htmlResult = await client.getPageContent(profileUrl)
    logs.push(`📄 Page HTML length: ${htmlResult.html.length} characters`)

    // Search for the code in various forms
    const codeVariations = [
      code,
      code.toUpperCase(),
      code.toLowerCase(),
      `"${code}"`,
      `'${code}'`,
      ` ${code} `,
      `>${code}<`,
      `>${code} `,
      ` ${code}<`
    ]

    const findings: any[] = []
    
    for (const variation of codeVariations) {
      const found = htmlResult.html.includes(variation)
      if (found) {
        // Find the context around the code
        const index = htmlResult.html.indexOf(variation)
        const before = htmlResult.html.substring(Math.max(0, index - 100), index)
        const after = htmlResult.html.substring(index + variation.length, Math.min(htmlResult.html.length, index + variation.length + 100))
        
        findings.push({
          variation,
          found: true,
          context: `...${before}[${variation}]${after}...`
        })
        logs.push(`✅ Found "${variation}" in HTML`)
      } else {
        findings.push({
          variation,
          found: false
        })
      }
    }

    const totalFound = findings.filter(f => f.found).length
    logs.push(`📊 Total variations found: ${totalFound}/${codeVariations.length}`)

    // Also check for common bio-related text patterns
    const bioKeywords = ['bio', 'description', 'about', 'profile']
    const bioSections: string[] = []
    
    for (const keyword of bioKeywords) {
      const regex = new RegExp(`"${keyword}"[^"]*"([^"]*)"`, 'gi')
      const matches = htmlResult.html.match(regex)
      if (matches) {
        bioSections.push(...matches)
        logs.push(`📝 Found ${matches.length} ${keyword} sections`)
      }
    }

    return NextResponse.json({
      success: true,
      platform,
      username,
      code,
      profileUrl,
      pageHtmlLength: htmlResult.html.length,
      findings,
      totalFound,
      bioSections: bioSections.slice(0, 10), // First 10 bio sections
      logs,
      screenshot: htmlResult.screenshot
    })

  } catch (error) {
    console.error('Code check error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Test failed",
      logs: [`❌ Error: ${error instanceof Error ? error.message : String(error)}`]
    }, { status: 500 })
  }
}
