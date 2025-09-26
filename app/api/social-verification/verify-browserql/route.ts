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
        profileUrl = `https://x.com/${username}` // Updated to X.com
        bioSelectors = [
          '[data-testid="UserDescription"]',
          '[data-testid="UserBio"]',
          'div[data-testid="UserDescription"] span',
          '[data-testid="UserProfileHeader_Items"] div[lang]',
          'div[role="tabpanel"] div[lang]'
        ]
        break
        
      case 'instagram':
        // Instagram URLs: clean username (remove @)
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
        logs.push(`📸 Instagram URL: ${profileUrl}`)
        break
        
      case 'tiktok':
        // TikTok URLs: handle both @username and username formats
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
        logs.push(`🎵 TikTok URL: ${profileUrl}`)
        break
        
      case 'youtube':
        // Try multiple YouTube URL formats
        const youtubeUrls = [
          `https://youtube.com/@${username}`,
          `https://youtube.com/c/${username}`,
          `https://youtube.com/channel/${username}`,
          `https://youtube.com/user/${username}`
        ]
        profileUrl = youtubeUrls[0] // Start with @username format
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

    // Extract bio content using BrowserQL selectors
    const result = await client.extractBioContent(profileUrl, bioSelectors)
    
    logs.push(`📄 Bio extraction completed`)
    logs.push(`📝 Found ${result.bioTexts.length} bio elements`)
    logs.push(`📸 Screenshot: ${result.screenshot ? 'captured' : 'none'}`)

    // Combine all bio texts
    let bio = result.bioTexts.join(' ').trim()
    
    // If no bio found via selectors, try getting page title as fallback
    if (!bio) {
      logs.push("🔄 No bio from selectors, trying page title as fallback...")
      const titleResult = await client.getBasicPageInfo(profileUrl)
      bio = titleResult.title || ""
      logs.push(`📄 Page title: "${bio}"`)
    }

    if (!bio || bio.trim() === '') {
      logs.push("❌ No bio content found")
      return NextResponse.json({
        success: false,
        error: "Profile bio not found or empty",
        logs,
        screenshot: result.screenshot
      }, { status: 400 })
    }

    // Search for the verification code
    const codeFound = bio.toLowerCase().includes(code.toLowerCase())
    logs.push(`🔍 Code search result: ${codeFound ? '✅ FOUND' : '❌ NOT FOUND'}`)

    if (codeFound) {
      logs.push(`🎯 Code found! Saving to database...`)
      
      // Save verification to database
      let verification
      try {
        verification = await prisma.socialVerification.create({
          data: {
            userId: session.user.id,
            platform: platform.toUpperCase() as any,
            code,
            verified: true,
            verifiedAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
          }
        })
        logs.push(`✅ Verification record created (ID: ${verification.id})`)
      } catch (verificationError) {
        logs.push(`❌ Verification record failed: ${verificationError instanceof Error ? verificationError.message : String(verificationError)}`)
        throw verificationError
      }
      
      // Handle multiple accounts per platform (allow different usernames)
      // Use case-insensitive username comparison
      const platformUpper = platform.toUpperCase()
      logs.push(`🔍 Looking for existing account: platform=${platformUpper}, username=${username}`)
      
      const existingAccount = await prisma.socialAccount.findFirst({
        where: {
          userId: session.user.id,
          platform: platformUpper as any,
          username: {
            equals: username,
            mode: 'insensitive' // Case-insensitive comparison
          }
        }
      })
      
      if (existingAccount) {
        logs.push(`🔍 Found existing account: ${existingAccount.id}`)
      } else {
        logs.push(`🔍 No existing account found for @${username}`)
      }

      try {
        if (existingAccount) {
          // Update existing account (re-verification of same username)
          await prisma.socialAccount.update({
            where: { id: existingAccount.id },
            data: {
              verified: true,
              verifiedAt: new Date(),
              displayName: `@${username}` // Update display name
            }
          })
          logs.push(`🔄 Updated existing account for @${username}`)
        } else {
          // Create new account (new username for this platform)  
          const socialAccount = await prisma.socialAccount.create({
            data: {
              userId: session.user.id,
              platform: platformUpper as any,
              username: username.toLowerCase(), // Store username in lowercase for consistency
              platformId: username.toLowerCase(),
              displayName: `@${username}`,
              verified: true,
              verifiedAt: new Date()
            }
          })
          logs.push(`✨ Created new account for @${username} (ID: ${socialAccount.id})`)
        }
      } catch (socialAccountError) {
        logs.push(`❌ Social account save failed: ${socialAccountError instanceof Error ? socialAccountError.message : String(socialAccountError)}`)
        // Don't throw here - verification record was already created
      }

      // Clean up old verification codes for this user/platform combo
      try {
        const deletedCodes = await prisma.socialVerification.deleteMany({
          where: {
            userId: session.user.id,
            platform: platformUpper as any,
            code: { not: code }, // Delete old codes, keep current one
            verified: false // Only delete unverified old codes
          }
        })
        logs.push(`🧹 Cleaned up ${deletedCodes.count} old verification codes`)
      } catch (cleanupError) {
        logs.push(`⚠️ Cleanup warning: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`)
        // Don't fail the verification for cleanup issues
      }
      
      logs.push(`✅ Verification saved to database (ID: ${verification.id})`)
      logs.push(`🔗 Social account connection updated`)
    }

    if (codeFound) {
      return NextResponse.json({
        success: true,
        verified: true,
        message: `✅ Verification successful! Code "${code}" found in @${username}'s bio`,
        logs,
        bio: bio.substring(0, 500), // First 500 chars for debugging
        screenshot: result.screenshot
      })
    } else {
      return NextResponse.json({
        success: false,
        verified: false,
        error: `Code "${code}" not found in @${username}'s bio`,
        message: `❌ Code "${code}" not found in @${username}'s bio`,
        logs,
        bio: bio.substring(0, 500), // First 500 chars for debugging
        screenshot: result.screenshot
      }, { status: 400 })
    }

  } catch (error) {
    console.error('BrowserQL verification error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Verification failed",
      logs: [`❌ Error: ${error instanceof Error ? error.message : String(error)}`]
    }, { status: 500 })
  }
}
