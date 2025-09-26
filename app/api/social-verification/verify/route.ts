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

// Instagram bio checking via web scraping with enhanced anti-bot measures
async function checkInstagramBio(username: string, code: string): Promise<boolean> {
  try {
    const url = `https://www.instagram.com/${username}/`
    console.log(`🔍 Checking Instagram profile: ${url}`)
    
    // Add randomized delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000))
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(15000)
    })
    
    if (!response.ok) {
      console.error(`Instagram profile not accessible: ${username} - Status: ${response.status}`)
      
      if (response.status === 429) {
        console.log(`Rate limited - Instagram is blocking our requests`)
        return false
      }
      
      if (response.status === 404) {
        console.log(`Profile not found: ${username}`)
        return false
      }
      
      if (response.status === 403) {
        console.log(`Access forbidden for profile: ${username} - may be private or restricted`)
        return false
      }
      
      return false
    }
    
    const html = await response.text()
    console.log(`✅ Successfully fetched Instagram page (${html.length} characters)`)
    
    // Enhanced patterns for extracting bio/description
    const patterns = [
      // New Instagram GraphQL patterns (2024)
      /"biography":"([^"]*(?:\\.[^"]*)*)"/,
      /"description":"([^"]*(?:\\.[^"]*)*)"/,
      /"bio":"([^"]*(?:\\.[^"]*)*)"/,
      
      // Legacy patterns
      /biography['"]:[\s]*['"]([^'"]*)['"]/,
      /description['"]:[\s]*['"]([^'"]*)['"]/,
      
      // JSON-LD schema.org patterns
      /@type['"]:[\s]*['"]Person['"][\s\S]*?description['"]:[\s]*['"]([^'"]*)['"]/,
      
      // Meta tag patterns
      /<meta\s+property=['"]og:description['"][^>]*content=['"]([^'"]*)['"]/,
      /<meta\s+name=['"]description['"][^>]*content=['"]([^'"]*)['"]/,
      
      // Script tag patterns for shared data
      /window\._sharedData[\s]*=[\s]*{[\s\S]*?biography['"]:[\s]*['"]([^'"]*)['"]/,
      /"ProfilePage"[\s\S]*?biography['"]:[\s]*['"]([^'"]*)['"]/,
      
      // Direct text patterns (fallback)
      /biography[\s]*:[\s]*([^,}\]]+)/,
    ]
    
    let bio = ''
    let patternUsed = -1
    
    for (let i = 0; i < patterns.length; i++) {
      const match = html.match(patterns[i])
      if (match && match[1] && match[1].trim()) {
        bio = match[1].trim()
        patternUsed = i
        console.log(`📝 Found bio using pattern ${i + 1}: "${bio.substring(0, 100)}${bio.length > 100 ? '...' : ''}"`)
        break
      }
    }
    
    if (!bio) {
      console.error(`❌ Could not extract Instagram bio for: ${username} (tried ${patterns.length} patterns)`)
      
      // Check for common blocking indicators
      if (html.includes('This Account is Private') || html.includes('private')) {
        console.log(`❌ Account appears to be private: ${username}`)
        return false
      }
      
      if (html.includes('User not found') || html.includes('Page Not Found')) {
        console.log(`❌ Account does not exist: ${username}`)
        return false
      }
      
      if (html.includes('challenge') || html.includes('checkpoint')) {
        console.log(`❌ Instagram is challenging our request - may need different approach`)
        return false
      }
      
      // Log a snippet of the HTML for debugging
      console.log(`HTML snippet (first 500 chars): ${html.substring(0, 500)}`)
      return false
    }
    
    // Decode Unicode escape sequences and HTML entities
    let decodedBio = bio
      .replace(/\\u[\dA-F]{4}/gi, (match) => {
        return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16))
      })
      .replace(/\\n/g, ' ')
      .replace(/\\t/g, ' ')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
    
    console.log(`📝 Bio extracted (pattern ${patternUsed + 1}): "${decodedBio.substring(0, 100)}${decodedBio.length > 100 ? '...' : ''}"`)
    console.log(`🔍 Looking for code: "${code}"`)
    
    // Case-insensitive search for better matching
    const codeFound = decodedBio.toLowerCase().includes(code.toLowerCase())
    console.log(`Instagram bio check for @${username}: ${codeFound ? '✅ FOUND' : '❌ NOT FOUND'}`)
    
    if (!codeFound) {
      console.log(`Bio content: "${decodedBio}"`)
      console.log(`Expected code: "${code}"`)
    }
    
    return codeFound
    
  } catch (error) {
    console.error(`❌ Instagram bio check failed for ${username}:`, error)
    
    // If timeout or network error, log specific error type
    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        console.log(`🔄 Request timed out for ${username}`)
      } else if (error.name === 'TypeError') {
        console.log(`🔄 Network error for ${username}`)
      }
    }
    
    return false
  }
}

// YouTube channel description checking with enhanced anti-bot measures
async function checkYouTubeBio(username: string, code: string): Promise<boolean> {
  try {
    console.log(`🔍 Checking YouTube channel: @${username}`)
    
    // Try multiple channel URL formats
    const urls = [
      `https://www.youtube.com/@${username}`,
      `https://www.youtube.com/c/${username}`,
      `https://www.youtube.com/user/${username}`,
      `https://www.youtube.com/channel/${username}`
    ]
    
    // Add randomized delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000))
    
    for (const url of urls) {
      try {
        console.log(`🔍 Trying YouTube URL: ${url}`)
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none'
          },
          signal: AbortSignal.timeout(15000)
        })
        
        if (!response.ok) {
          console.log(`YouTube URL ${url} returned ${response.status}`)
          continue
        }
        
        const html = await response.text()
        console.log(`✅ Successfully fetched YouTube page (${html.length} characters)`)
        
        // Enhanced patterns for YouTube description extraction
        const patterns = [
          // New YouTube structure patterns
          /"description":{"simpleText":"([^"]*(?:\\.[^"]*)*)"/,
          /"description":"([^"]*(?:\\.[^"]*)*)"/,
          // Alternative patterns
          /description['"]:[\s]*['"]([^'"]*)['"],/,
          // Meta tag patterns
          /<meta\s+name=['"]description['"][^>]*content=['"]([^'"]*)['"][^>]*>/,
          /<meta\s+property=['"]og:description['"][^>]*content=['"]([^'"]*)['"][^>]*>/,
          // JSON-LD patterns
          /@type['"]:[\s]*['"]VideoObject['"][\s\S]*?description['"]:[\s]*['"]([^'"]*)['"],/,
          // Fallback patterns
          /channelMetadataRenderer[\s\S]*?description['"]:[\s]*['"]([^'"]*)['"],/
        ]
        
        let description = ''
        let patternUsed = -1
        
        for (let i = 0; i < patterns.length; i++) {
          const match = html.match(patterns[i])
          if (match && match[1] && match[1].trim()) {
            description = match[1].trim()
            patternUsed = i
            console.log(`📝 Found YouTube description using pattern ${i + 1}: "${description.substring(0, 100)}${description.length > 100 ? '...' : ''}"`)
            break
          }
        }
        
        if (!description) {
          console.log(`❌ No description found for YouTube channel: ${username}`)
          continue
        }
        
        // Decode entities
        const decodedDescription = description
          .replace(/\\u[\dA-F]{4}/gi, (match) => {
            return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16))
          })
          .replace(/\\n/g, ' ')
          .replace(/\\t/g, ' ')
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
        
        console.log(`📝 YouTube description: "${decodedDescription}"`)
        console.log(`🔍 Looking for code: "${code}"`)
        
        // Case-insensitive search
        const codeFound = decodedDescription.toLowerCase().includes(code.toLowerCase())
        console.log(`YouTube description check for @${username}: ${codeFound ? '✅ FOUND' : '❌ NOT FOUND'}`)
        
        if (codeFound) {
          return true
        }
        
      } catch (error) {
        console.log(`Failed to check YouTube URL: ${url} - ${error}`)
        continue
      }
    }
    
    console.error(`❌ Could not find verification code in YouTube channel: ${username}`)
    return false
    
  } catch (error) {
    console.error(`❌ YouTube bio check failed for ${username}:`, error)
    return false
  }
}

// TikTok bio checking with enhanced anti-bot measures
async function checkTikTokBio(username: string, code: string): Promise<boolean> {
  try {
    const url = `https://www.tiktok.com/@${username}`
    console.log(`🔍 Checking TikTok profile: ${url}`)
    
    // Add randomized delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000))
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none'
      },
      signal: AbortSignal.timeout(15000)
    })
    
    if (!response.ok) {
      console.error(`TikTok profile not accessible: ${username} - Status: ${response.status}`)
      
      if (response.status === 429) {
        console.log(`Rate limited - TikTok is blocking our requests`)
      } else if (response.status === 404) {
        console.log(`TikTok profile not found: ${username}`)
      }
      
      return false
    }
    
    const html = await response.text()
    console.log(`✅ Successfully fetched TikTok page (${html.length} characters)`)
    
    // Enhanced patterns for TikTok bio extraction
    const patterns = [
      // TikTok structure patterns
      /"desc":"([^"]*(?:\\.[^"]*)*)"/,
      /"description":"([^"]*(?:\\.[^"]*)*)"/,
      /"bio":"([^"]*(?:\\.[^"]*)*)"/,
      // Alternative patterns
      /description['"]:[\s]*['"]([^'"]*)['"],/,
      /bio['"]:[\s]*['"]([^'"]*)['"],/,
      // Meta tag patterns
      /<meta\s+name=['"]description['"][^>]*content=['"]([^'"]*)['"][^>]*>/,
      /<meta\s+property=['"]og:description['"][^>]*content=['"]([^'"]*)['"][^>]*>/,
      // JSON-LD patterns
      /@type['"]:[\s]*['"]Person['"][\s\S]*?description['"]:[\s]*['"]([^'"]*)['"],/
    ]
    
    let bio = ''
    let patternUsed = -1
    
    for (let i = 0; i < patterns.length; i++) {
      const match = html.match(patterns[i])
      if (match && match[1] && match[1].trim()) {
        bio = match[1].trim()
        patternUsed = i
        console.log(`📝 Found TikTok bio using pattern ${i + 1}: "${bio.substring(0, 100)}${bio.length > 100 ? '...' : ''}"`)
        break
      }
    }
    
    if (!bio) {
      console.error(`❌ Could not extract TikTok bio for: ${username}`)
      
      // Check for common issues
      if (html.includes('private') || html.includes('Private account')) {
        console.log(`❌ TikTok account appears to be private: ${username}`)
      } else if (html.includes('not found') || html.includes('User not found')) {
        console.log(`❌ TikTok account does not exist: ${username}`)
      }
      
      return false
    }
    
    // Decode entities
    const decodedBio = bio
      .replace(/\\u[\dA-F]{4}/gi, (match) => {
        return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16))
      })
      .replace(/\\n/g, ' ')
      .replace(/\\t/g, ' ')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
    
    console.log(`📝 TikTok bio: "${decodedBio}"`)
    console.log(`🔍 Looking for code: "${code}"`)
    
    // Case-insensitive search
    const codeFound = decodedBio.toLowerCase().includes(code.toLowerCase())
    console.log(`TikTok bio check for @${username}: ${codeFound ? '✅ FOUND' : '❌ NOT FOUND'}`)
    
    return codeFound
    
  } catch (error) {
    console.error(`❌ TikTok bio check failed for ${username}:`, error)
    return false
  }
}

// Twitter/X bio checking with enhanced anti-bot measures
async function checkTwitterBio(username: string, code: string): Promise<boolean> {
  try {
    // Try both twitter.com and x.com
    const urls = [`https://twitter.com/${username}`, `https://x.com/${username}`]
    
    for (const url of urls) {
      try {
        console.log(`🔍 Checking Twitter/X profile: ${url}`)
        
        // Add randomized delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000))
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none'
          },
          signal: AbortSignal.timeout(15000)
        })
        
        if (!response.ok) {
          console.log(`Twitter/X URL ${url} returned ${response.status}`)
          continue
        }
        
        const html = await response.text()
        console.log(`✅ Successfully fetched Twitter/X page (${html.length} characters)`)
        
        // Enhanced patterns for Twitter/X bio extraction
        const patterns = [
          // Twitter structure patterns
          /"description":"([^"]*(?:\\.[^"]*)*)"/,
          /"bio":"([^"]*(?:\\.[^"]*)*)"/,
          // Alternative patterns
          /description['"]:[\s]*['"]([^'"]*)['"],/,
          /bio['"]:[\s]*['"]([^'"]*)['"],/,
          // Meta tag patterns
          /<meta\s+name=['"]description['"][^>]*content=['"]([^'"]*)['"][^>]*>/,
          /<meta\s+property=['"]og:description['"][^>]*content=['"]([^'"]*)['"][^>]*>/,
          /<meta\s+property=['"]twitter:description['"][^>]*content=['"]([^'"]*)['"][^>]*>/,
          // JSON-LD patterns
          /@type['"]:[\s]*['"]Person['"][\s\S]*?description['"]:[\s]*['"]([^'"]*)['"],/
        ]
        
        let bio = ''
        let patternUsed = -1
        
        for (let i = 0; i < patterns.length; i++) {
          const match = html.match(patterns[i])
          if (match && match[1] && match[1].trim()) {
            bio = match[1].trim()
            patternUsed = i
            console.log(`📝 Found Twitter/X bio using pattern ${i + 1}: "${bio.substring(0, 100)}${bio.length > 100 ? '...' : ''}"`)
            break
          }
        }
        
        if (!bio) {
          console.log(`❌ No bio found for Twitter/X profile: ${username}`)
          continue
        }
        
        // Decode entities
        const decodedBio = bio
          .replace(/\\u[\dA-F]{4}/gi, (match) => {
            return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16))
          })
          .replace(/\\n/g, ' ')
          .replace(/\\t/g, ' ')
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
        
        console.log(`📝 Twitter/X bio: "${decodedBio}"`)
        console.log(`🔍 Looking for code: "${code}"`)
        
        // Case-insensitive search
        const codeFound = decodedBio.toLowerCase().includes(code.toLowerCase())
        console.log(`Twitter/X bio check for @${username}: ${codeFound ? '✅ FOUND' : '❌ NOT FOUND'}`)
        
        if (codeFound) {
          return true
        }
        
      } catch (error) {
        console.log(`Failed to check Twitter/X URL: ${url} - ${error}`)
        continue
      }
    }
    
    console.error(`❌ Could not find verification code in Twitter/X profile: ${username}`)
    return false
    
  } catch (error) {
    console.error(`❌ Twitter/X bio check failed for ${username}:`, error)
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
      // Provide more specific error messages based on the platform
      let errorMessage = `Verification code ${verification.code} not found in your ${platform} bio.`
      let suggestions: string[] = []

      if (platform === 'instagram') {
        suggestions = [
          "Make sure your Instagram profile is public (not private)",
          "Add the exact code to your bio section",
          "Save your profile changes before verifying",
          "Wait a few seconds after saving before trying to verify"
        ]
      } else if (platform === 'youtube') {
        suggestions = [
          "Add the code to your channel description",
          "Make sure your channel is public",
          "Save the description changes"
        ]
      } else if (platform === 'twitter') {
        suggestions = [
          "Add the code to your Twitter/X bio",
          "Make sure your profile is public",
          "Save your profile changes"
        ]
      } else if (platform === 'tiktok') {
        suggestions = [
          "Add the code to your TikTok bio",
          "Make sure your profile is public",
          "Save your bio changes"
        ]
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          suggestions,
          details: {
            platform,
            username,
            code: verification.code,
            codeChecked: true,
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error("Error verifying social account:", error)
    
    // Enhanced error logging for debugging
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
