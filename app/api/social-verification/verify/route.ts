import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
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

// Instagram bio checking via Apify (professional scraping service)
async function checkInstagramBio(username: string, code: string): Promise<boolean> {
  try {
    const APIFY_API_KEY = process.env.APIFY_API_KEY
    if (!APIFY_API_KEY) {
      console.error('❌ APIFY_API_KEY not configured - falling back to manual scraping')
      return await checkInstagramBioManual(username, code)
    }

    console.log(`🔍 Checking Instagram profile via Apify: @${username}`)

    // Step 1: Start the Instagram scraper run
    const runResponse = await fetch('https://api.apify.com/v2/acts/apify~instagram-profile-scraper/runs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APIFY_API_KEY}`
      },
      body: JSON.stringify({
        "usernames": [username],
        "resultsPerPage": 1,
        "shouldDownloadCovers": false,
        "shouldDownloadSlideshowImages": false,
        "shouldDownloadVideos": false
      })
    })

    if (!runResponse.ok) {
      console.error(`❌ Apify run creation failed: ${runResponse.status} ${runResponse.statusText}`)
      if (runResponse.status === 401) {
        console.log('❌ Invalid Apify API key - falling back to manual scraping')
        return await checkInstagramBioManual(username, code)
      }
      return false
    }

    const runData = await runResponse.json()
    const runId = runData.data.id
    const datasetId = runData.data.defaultDatasetId

    console.log(`✅ Apify run started: ${runId}`)

    // Step 2: Wait for the run to complete (with timeout)
    const maxWaitTime = 60000 // 60 seconds
    const checkInterval = 2000 // 2 seconds
    let elapsed = 0

    while (elapsed < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, checkInterval))
      elapsed += checkInterval

      const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${APIFY_API_KEY}`
        }
      })

      if (!statusResponse.ok) {
        console.error(`❌ Failed to check run status: ${statusResponse.status}`)
        break
      }

      const statusData = await statusResponse.json()
      const runStatus = statusData.data.status

      console.log(`🔄 Run status: ${runStatus} (${Math.round(elapsed/1000)}s)`)

      if (runStatus === 'SUCCEEDED') {
        // Step 3: Get the results from the dataset
        const resultsResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?limit=1`, {
          headers: {
            'Authorization': `Bearer ${APIFY_API_KEY}`
          }
        })

        if (!resultsResponse.ok) {
          console.error(`❌ Failed to get results: ${resultsResponse.status}`)
          return false
        }

        const resultsData = await resultsResponse.json()

        if (!resultsData || resultsData.length === 0) {
          console.error(`❌ No profile data returned from Apify for: ${username}`)
          return false
        }

        const profile = resultsData[0]
        const bio = profile.biography || profile.bio || profile.description || ''

        if (!bio) {
          console.error(`❌ No bio found in Apify data for: ${username}`)
          console.log(`Profile data keys:`, Object.keys(profile))
          return false
        }

        // Decode Unicode escape sequences
        const decodedBio = bio.replace(/\\u[\dA-F]{4}/gi, (match: string) => {
          return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16))
        })

        console.log(`📝 Bio extracted via Apify: "${decodedBio.substring(0, 100)}${decodedBio.length > 100 ? '...' : ''}"`)
        console.log(`🔍 Looking for code: "${code}"`)

        const codeFound = decodedBio.includes(code)
        console.log(`Instagram bio check for @${username}: ${codeFound ? '✅ FOUND' : '❌ NOT FOUND'}`)

        if (!codeFound) {
          console.log(`Bio content: "${decodedBio}"`)
          console.log(`Expected code: "${code}"`)
        }

        return codeFound

      } else if (runStatus === 'FAILED' || runStatus === 'ABORTED' || runStatus === 'TIMED-OUT') {
        console.error(`❌ Apify run failed with status: ${runStatus}`)
        break
      }

      // Continue waiting if still running
    }

    console.error(`❌ Apify run timed out after ${maxWaitTime/1000} seconds`)
    return false

  } catch (error) {
    console.error(`❌ Apify Instagram bio check failed for ${username}:`, error)
    // Fallback to manual scraping on error
    console.log('🔄 Falling back to manual scraping...')
    return await checkInstagramBioManual(username, code)
  }
}

// Fallback manual scraping function
async function checkInstagramBioManual(username: string, code: string): Promise<boolean> {
  try {
    const url = `https://www.instagram.com/${username}/`
    console.log(`🔍 Manual fallback - Checking Instagram profile: ${url}`)

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
      .replace(/\\u[\dA-F]{4}/gi, (match: string) => {
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
    console.error(`❌ Manual Instagram bio check failed for ${username}:`, error)

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
// YouTube channel description checking via Apify (pratikdani/youtube-profile-scraper)
async function checkYouTubeBio(username: string, code: string): Promise<boolean> {
  try {
    const APIFY_API_KEY = process.env.APIFY_API_KEY
    if (!APIFY_API_KEY) {
      console.error('❌ APIFY_API_KEY not configured for YouTube')
      return false
    }

    console.log(`🔍 Checking YouTube channel via Apify: @${username}`)

    // Use pratikdani/youtube-profile-scraper
    const runResponse = await fetch('https://api.apify.com/v2/acts/pratikdani~youtube-profile-scraper/runs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APIFY_API_KEY}`
      },
      body: JSON.stringify({
        "url": `https://www.youtube.com/@${username}`
      })
    })

    if (!runResponse.ok) {
      console.error(`❌ YouTube Apify run failed: ${runResponse.status}`)
      return false
    }

    const runData = await runResponse.json()
    const runId = runData.data.id
    const datasetId = runData.data.defaultDatasetId

    // Wait for completion (longer timeout for YouTube as it takes more time)
    const maxWaitTime = 60000 // 60 seconds for YouTube
    const checkInterval = 2000
    let elapsed = 0

    while (elapsed < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, checkInterval))
      elapsed += checkInterval

      const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
        headers: { 'Authorization': `Bearer ${APIFY_API_KEY}` }
      })

      if (!statusResponse.ok) break

      const statusData = await statusResponse.json()
      const runStatus = statusData.data.status

      if (runStatus === 'SUCCEEDED') {
        const resultsResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?limit=1`, {
          headers: { 'Authorization': `Bearer ${APIFY_API_KEY}` }
        })

        if (!resultsResponse.ok) return false

        const resultsData = await resultsResponse.json()
        if (!resultsData || resultsData.length === 0) return false

        const profile = resultsData[0]
        const description = profile.Description || profile.description || ''

        if (!description) {
          console.error(`❌ No description found in YouTube data for: ${username}`)
          return false
        }

        const codeFound = description.includes(code)
        console.log(`YouTube description check for @${username}: ${codeFound ? '✅ FOUND' : '❌ NOT FOUND'}`)

        return codeFound

      } else if (runStatus === 'FAILED' || runStatus === 'ABORTED' || runStatus === 'TIMED-OUT') {
        console.error(`❌ YouTube Apify run failed: ${runStatus}`)
        break
      }
    }

    console.error(`❌ YouTube Apify run timed out`)
    return false

  } catch (error) {
    console.error(`❌ YouTube bio check failed for ${username}:`, error)
    return false
  }
}

// TikTok bio checking via Apify (abe/tiktok-profile-scraper)
async function checkTikTokBio(username: string, code: string): Promise<boolean> {
  try {
    const APIFY_API_KEY = process.env.APIFY_API_KEY
    if (!APIFY_API_KEY) {
      console.error('❌ APIFY_API_KEY not configured for TikTok')
      return false
    }

    console.log(`🔍 Checking TikTok profile via Apify: @${username}`)

    // Use abe/tiktok-profile-scraper
    const runResponse = await fetch('https://api.apify.com/v2/acts/abe~tiktok-profile-scraper/runs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APIFY_API_KEY}`
      },
      body: JSON.stringify({
        "usernames": [username],
        "tiktokSource": "user"
      })
    })

    if (!runResponse.ok) {
      console.error(`❌ TikTok Apify run failed: ${runResponse.status}`)
      return false
    }

    const runData = await runResponse.json()
    const runId = runData.data.id
    const datasetId = runData.data.defaultDatasetId

    // Wait for completion (longer timeout for TikTok)
    const maxWaitTime = 60000 // 60 seconds for TikTok
    const checkInterval = 2000
    let elapsed = 0

    while (elapsed < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, checkInterval))
      elapsed += checkInterval

      const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
        headers: { 'Authorization': `Bearer ${APIFY_API_KEY}` }
      })

      if (!statusResponse.ok) break

      const statusData = await statusResponse.json()
      const runStatus = statusData.data.status

      if (runStatus === 'SUCCEEDED') {
        const resultsResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?limit=1`, {
          headers: { 'Authorization': `Bearer ${APIFY_API_KEY}` }
        })

        if (!resultsResponse.ok) return false

        const resultsData = await resultsResponse.json()
        if (!resultsData || resultsData.length === 0) return false

        const profile = resultsData[0]
        const bio = profile.bio || profile.description || profile.tagline || ''

        if (!bio) {
          console.error(`❌ No bio found in TikTok data for: ${username}`)
          return false
        }

        const codeFound = bio.includes(code)
        console.log(`TikTok bio check for @${username}: ${codeFound ? '✅ FOUND' : '❌ NOT FOUND'}`)

        return codeFound

      } else if (runStatus === 'FAILED' || runStatus === 'ABORTED' || runStatus === 'TIMED-OUT') {
        console.error(`❌ TikTok Apify run failed: ${runStatus}`)
        break
      }
    }

    console.error(`❌ TikTok Apify run timed out`)
    return false

  } catch (error) {
    console.error(`❌ TikTok bio check failed for ${username}:`, error)
    return false
  }
}

// Twitter/X bio checking via Apify (fastcrawler/twitter-user-profile-fast-cheapest-scraper-2025)
async function checkTwitterBio(username: string, code: string): Promise<boolean> {
  try {
    const APIFY_API_KEY = process.env.APIFY_API_KEY
    if (!APIFY_API_KEY) {
      console.error('❌ APIFY_API_KEY not configured for Twitter/X')
      return false
    }

    console.log(`🔍 Checking Twitter/X profile via Apify: @${username}`)

    // Use fastcrawler/twitter-user-profile-fast-cheapest-scraper-2025
    const runResponse = await fetch('https://api.apify.com/v2/acts/fastcrawler~twitter-user-profile-fast-cheapest-scraper-2025/runs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APIFY_API_KEY}`
      },
      body: JSON.stringify({
        "queryUser": [username]
      })
    })

    if (!runResponse.ok) {
      console.error(`❌ Twitter Apify run failed: ${runResponse.status}`)
      return false
    }

    const runData = await runResponse.json()
    const runId = runData.data.id
    const datasetId = runData.data.defaultDatasetId

    // Wait for completion (longer timeout for Twitter)
    const maxWaitTime = 90000 // 90 seconds for Twitter
    const checkInterval = 2000
    let elapsed = 0

    while (elapsed < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, checkInterval))
      elapsed += checkInterval

      const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
        headers: { 'Authorization': `Bearer ${APIFY_API_KEY}` }
      })

      if (!statusResponse.ok) break

      const statusData = await statusResponse.json()
      const runStatus = statusData.data.status

      if (runStatus === 'SUCCEEDED') {
        const resultsResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?limit=1`, {
          headers: { 'Authorization': `Bearer ${APIFY_API_KEY}` }
        })

        if (!resultsResponse.ok) return false

        const resultsData = await resultsResponse.json()
        if (!resultsData || resultsData.length === 0) return false

        const profile = resultsData[0]
        const description = profile.description || profile.bio || ''

        if (!description) {
          console.error(`❌ No description found in Twitter data for: ${username}`)
          return false
        }

        const codeFound = description.includes(code)
        console.log(`Twitter bio check for @${username}: ${codeFound ? '✅ FOUND' : '❌ NOT FOUND'}`)

        return codeFound

      } else if (runStatus === 'FAILED' || runStatus === 'ABORTED' || runStatus === 'TIMED-OUT') {
        console.error(`❌ Twitter Apify run failed: ${runStatus}`)
        break
      }
    }

    console.error(`❌ Twitter Apify run timed out`)
    return false

  } catch (error) {
    console.error(`❌ Twitter bio check failed for ${username}:`, error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Get the database user ID
    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { id: true }
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      )
    },
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
        userId: dbUser.id,
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
      // Check if there are any verifications for this user/platform (even expired ones)
      const anyVerification = await prisma.socialVerification.findFirst({
        where: {
          userId: dbUser.id,
          platform: platformEnum as any
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      if (anyVerification) {
        if (anyVerification.verified) {
          return NextResponse.json(
            { error: "This platform is already verified for your account." },
            { status: 400 }
          )
        } else {
          return NextResponse.json(
            { error: "Your verification code has expired. Please generate a new code." },
            { status: 400 }
          )
        }
      }

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
          userId: dbUser.id,
          platform: platformEnum as any,
          username: username
        }
      })

      if (existingAccount) {
        // Only update if not already verified, or update non-critical fields
        if (!existingAccount.verified) {
        await prisma.socialAccount.update({
          where: { id: existingAccount.id },
          data: {
            displayName: displayName || platformName,
            verified: true,
            verifiedAt: new Date()
          }
        })
        } else {
          // Account already verified - just update display name if provided
          if (displayName && displayName !== existingAccount.displayName) {
            await prisma.socialAccount.update({
              where: { id: existingAccount.id },
              data: {
                displayName: displayName
              }
            })
          }
          console.log(`✅ Account @${username} on ${platform} is already verified`)
        }
      } else {
        // Create new account
        await prisma.socialAccount.create({
          data: {
            userId: dbUser.id,
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
