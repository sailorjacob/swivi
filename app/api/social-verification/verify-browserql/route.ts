import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { BrowserQLClient } from "@/lib/browserql-client"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { platform, username, code } = await request.json()

    if (!platform || !username || !code) {
      return NextResponse.json({ 
        error: "Missing required fields: platform, username, code" 
      }, { status: 400 })
    }

    const logs: string[] = []
    logs.push(`🤖 Starting BrowserQL ${platform} verification for @${username}`)
    logs.push(`🔑 Looking for code: ${code}`)

    const client = new BrowserQLClient()
    
    let profileUrl = ""
    let bioSelectors: string[] = []
    
    // Configure platform-specific settings
    switch (platform.toLowerCase()) {
      case 'twitter':
      case 'x':
        profileUrl = `https://twitter.com/${username}`
        bioSelectors = [
          '[data-testid="UserDescription"]',
          '[data-testid="UserBio"]',
          '.ProfileHeaderCard-bio',
          '.ProfileHeaderCard-bio p',
          '.css-901oao.r-18jsvk2.r-37j5jr.r-a023e6.r-16dba41.r-rjixqe.r-bcqeeo.r-qvutc0'
        ]
        break
        
      case 'instagram':
        profileUrl = `https://instagram.com/${username}`
        bioSelectors = [
          '.-vDIg span',
          '.C7I1f span',
          'section main article div span',
          'h1 + div span'
        ]
        break
        
      case 'tiktok':
        profileUrl = `https://tiktok.com/@${username}`
        bioSelectors = [
          '[data-e2e="user-bio"]',
          '.jsx-1438747715',
          'h2 + p'
        ]
        break
        
      case 'youtube':
        profileUrl = `https://youtube.com/@${username}`
        bioSelectors = [
          '#description-container',
          '.about-description',
          'yt-formatted-string#description'
        ]
        break
        
      default:
        return NextResponse.json({ 
          error: `Unsupported platform: ${platform}` 
        }, { status: 400 })
    }

    logs.push(`📍 Profile URL: ${profileUrl}`)
    logs.push(`🎯 Bio selectors: ${bioSelectors.length} patterns`)

    // Extract content using BrowserQL
    const result = await client.extractContent(profileUrl, bioSelectors)
    
    logs.push(`📄 Content extracted: ${result.content.length} elements`)
    logs.push(`📸 Screenshot: ${result.screenshot ? 'captured' : 'none'}`)

    // Combine all extracted text
    const allText = result.content.join(' ').trim()
    logs.push(`📝 Combined text length: ${allText.length} chars`)
    
    if (allText.length > 0) {
      logs.push(`📝 Bio preview: "${allText.substring(0, 200)}${allText.length > 200 ? '...' : ''}"`)
    }

    // If no text from selectors, try getting full page HTML
    let bio = allText
    if (!bio) {
      logs.push("🔄 No text from selectors, trying full page HTML...")
      const htmlResult = await client.getPageContent(profileUrl)
      
      // Extract bio from HTML using patterns
      const bioPatterns = [
        /"description":"([^"]*(?:\\.[^"]*)*)"/g,
        /"bio":"([^"]*(?:\\.[^"]*)*)"/g,
        /<meta\s+property=['"]og:description['"][^>]*content=['"]([^'"]*)['"][^>]*>/gi,
        /<meta\s+name=['"]description['"][^>]*content=['"]([^'"]*)['"][^>]*>/gi
      ]
      
      for (const pattern of bioPatterns) {
        const matches = htmlResult.html.match(pattern)
        if (matches && matches.length > 0) {
          const match = pattern.exec(htmlResult.html)
          if (match && match[1]) {
            bio = match[1].trim()
            logs.push(`📝 Bio found via HTML pattern: "${bio.substring(0, 100)}..."`)
            break
          }
        }
      }
    }

    if (!bio || bio.trim() === '') {
      logs.push("❌ No bio content found")
      return NextResponse.json({
        success: false,
        error: "Profile bio not found or empty",
        logs,
        screenshot: result.screenshot
      })
    }

    // Search for the verification code
    const codeFound = bio.toLowerCase().includes(code.toLowerCase())
    logs.push(`🔍 Code search result: ${codeFound ? '✅ FOUND' : '❌ NOT FOUND'}`)

    if (codeFound) {
      // Save verification to database
      const verification = await prisma.socialVerification.create({
        data: {
          userId: session.user.id,
          platform: platform.toUpperCase() as any,
          username,
          code,
          verified: true,
          verifiedAt: new Date()
        }
      })
      
      logs.push(`✅ Verification saved to database (ID: ${verification.id})`)
    }

    return NextResponse.json({
      success: codeFound,
      verified: codeFound,
      message: codeFound 
        ? `✅ Verification successful! Code "${code}" found in @${username}'s bio`
        : `❌ Code "${code}" not found in @${username}'s bio`,
      logs,
      bio: bio.substring(0, 500), // First 500 chars for debugging
      screenshot: result.screenshot
    })

  } catch (error) {
    console.error('BrowserQL verification error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Verification failed",
      logs: [`❌ Error: ${error instanceof Error ? error.message : String(error)}`]
    }, { status: 500 })
  }
}
