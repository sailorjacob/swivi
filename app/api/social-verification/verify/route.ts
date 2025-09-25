import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Real function to check if verification code exists in social media bio
async function checkCodeInBio(platform: string, username: string, code: string): Promise<boolean> {
  try {
    console.log(`🔍 Checking ${platform} profile for user: ${username} with code: ${code}`)

    switch (platform) {
      case 'instagram':
        return await checkInstagramBio(username, code)
      case 'youtube':
        return await checkYouTubeBio(username, code)
      case 'tiktok':
        return await checkTikTokBio(username, code)
      case 'twitter':
        return await checkTwitterBio(username, code)
      default:
        console.error(`Unsupported platform: ${platform}`)
        return false
    }
  } catch (error) {
    console.error(`Error checking ${platform} bio:`, error)
    return false
  }
}

// Instagram bio checking via web scraping (no API key required)
async function checkInstagramBio(username: string, code: string): Promise<boolean> {
  try {
    const url = `https://www.instagram.com/${username}/`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    if (!response.ok) {
      console.error(`Instagram profile not found: ${username}`)
      return false
    }
    
    const html = await response.text()
    
    // Instagram embeds profile data in JSON-LD script tags
    const bioMatch = html.match(/"biography":"([^"]*)"/)
    if (!bioMatch) {
      console.error(`Could not extract Instagram bio for: ${username}`)
      return false
    }
    
    const bio = bioMatch[1].replace(/\\u[\dA-F]{4}/gi, (match) => {
      return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16))
    })
    
    const codeFound = bio.includes(code)
    console.log(`Instagram bio check for @${username}: ${codeFound ? 'FOUND' : 'NOT FOUND'}`)
    return codeFound
    
  } catch (error) {
    console.error(`Instagram bio check failed for ${username}:`, error)
    return false
  }
}

// YouTube channel description checking
async function checkYouTubeBio(username: string, code: string): Promise<boolean> {
  try {
    // Try both channel URL formats
    const urls = [
      `https://www.youtube.com/@${username}`,
      `https://www.youtube.com/c/${username}`,
      `https://www.youtube.com/user/${username}`
    ]
    
    for (const url of urls) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        })
        
        if (response.ok) {
          const html = await response.text()
          
          // YouTube embeds channel data in script tags
          const descriptionMatch = html.match(/"description":{"simpleText":"([^"]*)"/)
          if (descriptionMatch) {
            const description = descriptionMatch[1]
            const codeFound = description.includes(code)
            console.log(`YouTube description check for ${username}: ${codeFound ? 'FOUND' : 'NOT FOUND'}`)
            return codeFound
          }
        }
      } catch (error) {
        console.log(`Failed to check YouTube URL: ${url}`)
        continue
      }
    }
    
    console.error(`Could not find YouTube channel: ${username}`)
    return false
    
  } catch (error) {
    console.error(`YouTube bio check failed for ${username}:`, error)
    return false
  }
}

// TikTok bio checking via web scraping
async function checkTikTokBio(username: string, code: string): Promise<boolean> {
  try {
    const url = `https://www.tiktok.com/@${username}`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    if (!response.ok) {
      console.error(`TikTok profile not found: ${username}`)
      return false
    }
    
    const html = await response.text()
    
    // TikTok embeds user data in script tags
    const bioMatch = html.match(/"desc":"([^"]*)"/)
    if (!bioMatch) {
      console.error(`Could not extract TikTok bio for: ${username}`)
      return false
    }
    
    const bio = bioMatch[1]
    const codeFound = bio.includes(code)
    console.log(`TikTok bio check for @${username}: ${codeFound ? 'FOUND' : 'NOT FOUND'}`)
    return codeFound
    
  } catch (error) {
    console.error(`TikTok bio check failed for ${username}:`, error)
    return false
  }
}

// Twitter/X bio checking via web scraping
async function checkTwitterBio(username: string, code: string): Promise<boolean> {
  try {
    const url = `https://twitter.com/${username}`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    if (!response.ok) {
      console.error(`Twitter profile not found: ${username}`)
      return false
    }
    
    const html = await response.text()
    
    // Twitter embeds user data in script tags
    const bioMatch = html.match(/"description":"([^"]*)"/)
    if (!bioMatch) {
      console.error(`Could not extract Twitter bio for: ${username}`)
      return false
    }
    
    const bio = bioMatch[1]
    const codeFound = bio.includes(code)
    console.log(`Twitter bio check for @${username}: ${codeFound ? 'FOUND' : 'NOT FOUND'}`)
    return codeFound
    
  } catch (error) {
    console.error(`Twitter bio check failed for ${username}:`, error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const { platform, username, displayName } = await request.json()

    if (!platform || !['instagram', 'youtube', 'tiktok', 'twitter'].includes(platform)) {
      return NextResponse.json(
        { error: "Invalid platform" },
        { status: 400 }
      )
    }

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      )
    }

    // Map platform strings to enum values
    const platformMap: Record<string, string> = {
      instagram: 'INSTAGRAM',
      youtube: 'YOUTUBE',
      tiktok: 'TIKTOK',
      twitter: 'TWITTER'
    }
    
    const platformEnum = platformMap[platform.toLowerCase()]
    
    // Get platform name for displayName fallback
    const platformNames: Record<string, string> = {
      instagram: 'Instagram',
      youtube: 'YouTube',
      tiktok: 'TikTok',
      twitter: 'X (Twitter)'
    }
    const platformName = platformNames[platform] || platform

    // Find the latest unverified code for this platform and user
    const verification = await prisma.socialVerification.findFirst({
      where: {
        userId: session.user.id,
        platform: platformEnum as any,
        verified: false,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!verification) {
      return NextResponse.json(
        { error: "No pending verification found. Please generate a new code." },
        { status: 404 }
      )
    }

    // Check if the code exists in the user's bio
    const codeFound = await checkCodeInBio(platform, username, verification.code)

    if (codeFound) {
      // Mark as verified and create/update social account
      await prisma.socialVerification.update({
        where: { id: verification.id },
        data: { verified: true, verifiedAt: new Date() }
      })

      // Check if account already exists (since we allow multiple accounts per platform)
      const existingAccount = await prisma.socialAccount.findFirst({
        where: {
          userId: session.user.id,
          platform: platformEnum as any,
          username: username
        }
      })

      if (existingAccount) {
        // Update existing account
        await prisma.socialAccount.update({
          where: { id: existingAccount.id },
          data: {
            displayName: displayName || platformName,
            verified: true,
            verifiedAt: new Date()
          }
        })
      } else {
        // Create new account
        await prisma.socialAccount.create({
          data: {
            userId: session.user.id,
            platform: platformEnum as any,
            username: username,
            displayName: displayName || platformName,
            platformId: `${platform}_${username}_${Date.now()}`, // Generate unique platform ID
            verified: true,
            verifiedAt: new Date()
          }
        })
      }

      return NextResponse.json({
        success: true,
        message: `Successfully verified ${platform} account!`,
        platform: platform,
        username: username
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: `Verification code ${verification.code} not found in your ${platform} bio. Please add it and try again.`
        },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error("Error verifying social account:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
