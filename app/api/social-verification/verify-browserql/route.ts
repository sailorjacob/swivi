import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"

// Import the working scraping functions directly


// YouTube channel description checking via Apify (pratikdani/youtube-profile-scraper)
async function checkYouTubeBio(username: string, code: string): Promise<boolean> {
  try {
    const APIFY_API_KEY = process.env.APIFY_API_KEY
    if (!APIFY_API_KEY) {
      console.error('❌ APIFY_API_KEY not configured for YouTube - falling back to manual scraping')
      return await checkYouTubeBioManual(username, code)
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
      console.error(`❌ YouTube Apify run failed: ${runResponse.status} - falling back to manual scraping`)
      if (runResponse.status === 401) {
        console.log('❌ Invalid Apify API key - falling back to manual scraping')
        return await checkYouTubeBioManual(username, code)
      }
      return await checkYouTubeBioManual(username, code)
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

        if (!resultsResponse.ok) return await checkYouTubeBioManual(username, code)

        const resultsData = await resultsResponse.json()
        if (!resultsData || resultsData.length === 0) return await checkYouTubeBioManual(username, code)

        const profile = resultsData[0]
        const description = profile.Description || profile.description || ''

        if (!description) {
          console.error(`❌ No description found in YouTube data for: ${username}`)
          return await checkYouTubeBioManual(username, code)
        }

        const codeFound = description.includes(code)
        console.log(`YouTube description check for @${username}: ${codeFound ? '✅ FOUND' : '❌ NOT FOUND'}`)

        return codeFound

      } else if (runStatus === 'FAILED' || runStatus === 'ABORTED' || runStatus === 'TIMED-OUT') {
        console.error(`❌ YouTube Apify run failed: ${runStatus} - falling back to manual scraping`)
        return await checkYouTubeBioManual(username, code)
      }
    }

    console.error(`❌ YouTube Apify run timed out - falling back to manual scraping`)
    return await checkYouTubeBioManual(username, code)

  } catch (error) {
    console.error(`❌ YouTube bio check failed for ${username}:`, error)
    return await checkYouTubeBioManual(username, code)
  }
}

// Manual fallback scraping function for YouTube
async function checkYouTubeBioManual(username: string, code: string): Promise<boolean> {
  try {
    const url = `https://www.youtube.com/@${username}`
    console.log(`🔍 Manual fallback - Checking YouTube channel: ${url}`)

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
      signal: AbortSignal.timeout(15000)
    })

    if (!response.ok) {
      console.error(`YouTube channel not accessible: ${username} - Status: ${response.status}`)
      if (response.status === 429) {
        console.log(`Rate limited - YouTube is blocking our requests`)
        return false
      }
      if (response.status === 404) {
        console.log(`Channel not found: ${username}`)
        return false
      }
      if (response.status === 403) {
        console.log(`Access forbidden for channel: ${username} - may be private or restricted`)
        return false
      }
      return false
    }

    const html = await response.text()
    console.log(`✅ Successfully fetched YouTube page (${html.length} characters)`)

    // Extract description from YouTube channel page
    // Look for the meta description or og:description
    const descriptionPatterns = [
      /<meta\s+property="og:description"\s+content="([^"]*)"/i,
      /<meta\s+name="description"\s+content="([^"]*)"/i,
      /"description":\s*"([^"]*(?:\\.[^"]*)*)"/i,
      /"shortDescription":\s*"([^"]*(?:\\.[^"]*)*)"/i
    ]

    let description = ''

    for (const pattern of descriptionPatterns) {
      const match = html.match(pattern)
      if (match && match[1]) {
        description = match[1].replace(/\\"/g, '"')
        break
      }
    }

    if (!description) {
      console.error(`❌ No description found in YouTube HTML for: ${username}`)
      return false
    }

    const codeFound = description.includes(code)
    console.log(`YouTube manual description check for @${username}: ${codeFound ? '✅ FOUND' : '❌ NOT FOUND'}`)
    console.log(`📝 Description preview: ${description.substring(0, 100)}...`)

    return codeFound

  } catch (error) {
    console.error(`❌ Manual YouTube bio check failed for ${username}:`, error)
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
    const requestBody = {
      "queryUser": [username],
      "shouldIncludeUserById": true,
      "shouldIncludeUserByScreenName": true,
      "maxItems": 1
    }

    const runResponse = await fetch('https://api.apify.com/v2/acts/fastcrawler~twitter-user-profile-fast-cheapest-scraper-2025/runs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APIFY_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    })


    if (!runResponse.ok) {
      const errorText = await runResponse.text()
      console.error(`❌ Twitter Apify run failed: ${runResponse.status} - ${errorText}`)
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
        const resultsResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?limit=10`, {
          headers: { 'Authorization': `Bearer ${APIFY_API_KEY}` }
        })

        if (!resultsResponse.ok) return false

        const resultsData = await resultsResponse.json()
        if (!resultsData || resultsData.length === 0) return false

        // Check multiple profiles if returned (sometimes multiple users match)
        for (const profile of resultsData) {
          const usernameMatch = profile.username === username || profile.screenName === username
          if (usernameMatch) {
            const description = profile.description || profile.bio || ''
            console.log(`✅ Found matching Twitter profile: @${profile.username}`)

            if (!description) {
              console.error(`❌ No description found in Twitter data for: ${username}`)
              continue
            }

            const codeFound = description.includes(code)
            console.log(`Twitter bio check for @${username}: ${codeFound ? '✅ FOUND' : '❌ NOT FOUND'}`)

            if (codeFound) {
              return true
            }
          }
        }

        console.error(`❌ No matching Twitter profile found for: ${username}`)
        return false

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

    return codeFound

  } catch (error) {
    console.error(`❌ Manual Instagram bio check failed for ${username}:`, error)
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

export async function POST(request: NextRequest) {
  console.log('🚀 === BROWSERQL VERIFICATION ENDPOINT START ===')
  console.log('📍 Request URL:', request.url)
  console.log('📍 Request method:', request.method)
  console.log('📍 Request headers:', Object.fromEntries(request.headers.entries()))
  
  try {
    console.log('🔍 BrowserQL verification endpoint called')
    
    const { user, error } = await getServerUserWithRole(request)
    console.log('🔍 Auth result:', { hasUser: !!user, userId: user?.id, error: error?.message })
    
    if (!user?.id || error) {
      console.log('❌ Authentication failed:', { hasUser: !!user, error: error?.message })
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get the database user ID
    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { id: true }
    })
    console.log('🔍 Database user lookup:', { found: !!dbUser, dbUserId: dbUser?.id })

    if (!dbUser) {
      console.log('❌ User not found in database')
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      )
    }

    let requestBody
    try {
      console.log('📥 Attempting to parse request body...')
      requestBody = await request.json()
      console.log('✅ Request body parsed successfully:', requestBody)
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError)
      return NextResponse.json({ 
        error: "Invalid JSON in request body",
        details: parseError.message
      }, { status: 400 })
    }
    
    const { platform, username, code } = requestBody
    console.log('🔍 Extracted fields:', { platform, username, hasCode: !!code, codeLength: code?.length })

    if (!platform || !username) {
      console.log('❌ Missing required fields:', { platform, username, hasCode: !!code })
      return NextResponse.json({ 
        error: "Missing required fields: platform, username",
        received: { platform, username, hasCode: !!code }
      }, { status: 400 })
    }
    
    console.log('✅ Request validation passed:', { platform, username, hasCode: !!code })

    const logs: string[] = []
    logs.push(`🤖 Starting verification for @${username} on ${platform}`)
    logs.push(`🔑 Provided code: ${code || 'none (will use database code)'}`)

    // Determine which code to use for verification
    let verificationCode = code // Use provided code if available

    if (!verificationCode) {
      // If no code provided, find the latest unverified code from database
      const platformMap: Record<string, string> = {
        instagram: 'INSTAGRAM',
        youtube: 'YOUTUBE',
        tiktok: 'TIKTOK',
        twitter: 'TWITTER',
        x: 'TWITTER'
      }
      const platformEnum = platformMap[platform.toLowerCase()]

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
        logs.push(`❌ No pending verification found for ${platform}`)
        return NextResponse.json({
          success: false,
          error: "No pending verification found. Please generate a new code first.",
          logs
        }, { status: 404 })
      }

      verificationCode = verification.code
      logs.push(`✅ Using database verification code: ${verificationCode}`)
    } else {
      logs.push(`✅ Using provided verification code: ${verificationCode}`)
    }

    // Clean username (remove @ if present)
    const cleanUsername = username.replace('@', '')

    // Clean up any duplicate or expired verification records for this user/platform
    try {
      const platformMap: Record<string, string> = {
        instagram: 'INSTAGRAM',
        youtube: 'YOUTUBE',
        tiktok: 'TIKTOK',
        twitter: 'TWITTER',
        x: 'TWITTER'
      }
      const platformEnum = platformMap[platform.toLowerCase()]

      // Delete expired verifications
      const expiredDeleted = await prisma.socialVerification.deleteMany({
        where: {
          userId: dbUser.id,
          platform: platformEnum as any,
          expiresAt: {
            lt: new Date()
          }
        }
      })

      if (expiredDeleted.count > 0) {
        logs.push(`🧹 Cleaned up ${expiredDeleted.count} expired verification(s)`)
      }

      // Delete duplicate unverified verifications (keep only the most recent)
      const allVerifications = await prisma.socialVerification.findMany({
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

      if (allVerifications.length > 1) {
        const toDelete = allVerifications.slice(1) // Keep only the most recent
        for (const verification of toDelete) {
          await prisma.socialVerification.delete({
            where: { id: verification.id }
          })
        }
        logs.push(`🧹 Cleaned up ${toDelete.length} duplicate verification(s)`)
      }
    } catch (cleanupError) {
      logs.push(`⚠️ Could not clean up verifications: ${cleanupError}`)
      // Don't fail the whole process for cleanup issues
    }

    // Check if this profile is already verified for this user
    try {
      const platformMap: Record<string, string> = {
        instagram: 'INSTAGRAM',
        youtube: 'YOUTUBE',
        tiktok: 'TIKTOK',
        twitter: 'TWITTER',
        x: 'TWITTER'
      }
      const platformEnum = platformMap[platform.toLowerCase()]

      const existingAccount = await prisma.socialAccount.findFirst({
        where: {
          userId: dbUser.id,
          platform: platformEnum as any,
          username: {
            equals: cleanUsername,
            mode: 'insensitive'
          }
        }
      })

      if (existingAccount && existingAccount.verified) {
        logs.push(`✅ Profile @${cleanUsername} is already verified`)
        return NextResponse.json({
          success: true,
          verified: true,
          message: `✅ Profile @${cleanUsername} is already verified for ${platform}`,
          logs,
          platform: platform,
          username: cleanUsername,
          existing: true
        })
      }
    } catch (checkError) {
      logs.push(`⚠️ Could not check existing accounts: ${checkError}`)
      // Continue with verification even if check fails
    }

    // Check the bio using our Apify integration
    let codeFound = false
    let bio = ""

    switch (platform.toLowerCase()) {
      case 'instagram':
        logs.push(`📸 Checking Instagram bio via Apify for @${cleanUsername}`)
        codeFound = await checkInstagramBio(cleanUsername, verificationCode)
        if (codeFound) {
          bio = verificationCode // We know it contains the code since verification succeeded
        }
        break

      case 'youtube':
        logs.push(`📺 Checking YouTube bio via Apify for @${cleanUsername}`)
        codeFound = await checkYouTubeBio(cleanUsername, verificationCode)
        if (codeFound) {
          bio = verificationCode
        }
        break

      case 'twitter':
      case 'x':
        logs.push(`🐦 Checking Twitter bio via Apify for @${cleanUsername}`)
        codeFound = await checkTwitterBio(cleanUsername, verificationCode)
        if (codeFound) {
          bio = verificationCode
        }
        break

      case 'tiktok':
        logs.push(`🎵 Checking TikTok bio via Apify for @${cleanUsername}`)
        codeFound = await checkTikTokBio(cleanUsername, verificationCode)
        if (codeFound) {
          bio = verificationCode
        }
        break
    }

    logs.push(`🔍 Code search result: ${codeFound ? '✅ FOUND' : '❌ NOT FOUND'}`)

    if (codeFound) {
      logs.push(`🎯 Code found! Saving to database...`)

      // Mark verification as verified
      const platformMap: Record<string, string> = {
        instagram: 'INSTAGRAM',
        youtube: 'YOUTUBE',
        tiktok: 'TIKTOK',
        twitter: 'TWITTER',
        x: 'TWITTER'
      }
      const platformEnum = platformMap[platform.toLowerCase()]

      try {
        await prisma.socialVerification.updateMany({
          where: {
            userId: dbUser.id,
            platform: platformEnum as any,
            code: verificationCode,
            verified: false
          },
          data: {
            verified: true,
            verifiedAt: new Date()
          }
        })
        logs.push(`✅ Updated verification record to verified`)
      } catch (verificationError) {
        logs.push(`❌ Failed to update verification record: ${verificationError instanceof Error ? verificationError.message : String(verificationError)}`)
        // Don't fail the whole process for this
      }

      // Check if account already exists (case-insensitive username matching)
      const existingAccount = await prisma.socialAccount.findFirst({
        where: {
          userId: dbUser.id,
          platform: platformEnum as any,
          username: {
            equals: cleanUsername,
            mode: 'insensitive'
          }
        }
      })

      try {
        if (existingAccount) {
          // Update existing account
          await prisma.socialAccount.update({
            where: { id: existingAccount.id },
            data: {
              verified: true,
              verifiedAt: new Date()
            }
          })
          logs.push(`🔄 Updated existing account for @${cleanUsername}`)
        } else {
          // Create new account
          await prisma.socialAccount.create({
            data: {
              userId: dbUser.id,
              platform: platformEnum as any,
              username: cleanUsername,
              displayName: `@${cleanUsername}`,
              platformId: `${platform}_${cleanUsername}_${Date.now()}`,
              verified: true,
              verifiedAt: new Date()
            }
          })
          logs.push(`✨ Created new account for @${cleanUsername}`)
        }
      } catch (accountError) {
        logs.push(`❌ Failed to save social account: ${accountError instanceof Error ? accountError.message : String(accountError)}`)
        // Don't fail the whole process for this
      }

      logs.push(`✅ Verification saved to database`)

      return NextResponse.json({
        success: true,
        verified: true,
        message: `✅ Verification successful! Code "${verificationCode}" found in @${cleanUsername}'s bio`,
        logs,
        bio: bio.substring(0, 500),
        platform: platform,
        username: cleanUsername
      })
    } else {
      logs.push(`❌ Verification failed - code not found in bio`)
      logs.push(`📋 Final logs summary:`)
      logs.forEach((log, index) => {
        logs.push(`  ${index + 1}. ${log}`)
      })

      return NextResponse.json({
        success: false,
        verified: false,
        error: `Code "${verificationCode}" not found in @${cleanUsername}'s bio`,
        message: `❌ Code "${verificationCode}" not found in @${cleanUsername}'s bio`,
        logs,
        bio: bio.substring(0, 500),
        platform: platform,
        username: cleanUsername,
        debugInfo: {
          codeSearched: verificationCode,
          timestamp: new Date().toISOString()
        }
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
