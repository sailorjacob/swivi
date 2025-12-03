// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"

// Import the working scraping functions directly


// Helper to normalize text for comparison (handles whitespace, special chars, case)
function normalizeForComparison(text: string): string {
  return text
    .toUpperCase() // Case insensitive
    .replace(/[\s\u200B\u200C\u200D\uFEFF]/g, '') // Remove all whitespace including zero-width chars
    .replace(/[^\w]/g, '') // Keep only alphanumeric
}

// YouTube channel description checking via Apify (pratikdani/youtube-profile-scraper)
// Returns { found: boolean, description?: string } so we can show the user what was found
async function checkYouTubeBio(username: string, code: string): Promise<{ found: boolean; description?: string }> {
  try {
    const APIFY_API_KEY = process.env.APIFY_API_KEY
    if (!APIFY_API_KEY) {
      console.error('❌ APIFY_API_KEY not configured for YouTube')
      return { found: false }
    }

    console.log(`🔍 Checking YouTube channel via Apify: @${username}`)

    // Use pratikdani/youtube-profile-scraper with forceResponseEncoding to avoid caching
    const runResponse = await fetch('https://api.apify.com/v2/acts/pratikdani~youtube-profile-scraper/runs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APIFY_API_KEY}`
      },
      body: JSON.stringify({
        "url": `https://www.youtube.com/@${username}`,
        // Force fresh scrape by adding timestamp to avoid Apify caching
        "forceResponseEncoding": "utf-8",
        "maxRequestRetries": 3
      })
    })

    if (!runResponse.ok) {
      console.error(`❌ YouTube Apify run failed: ${runResponse.status}`)
      return { found: false }
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

        if (!resultsResponse.ok) return { found: false }

        const resultsData = await resultsResponse.json()
        if (!resultsData || resultsData.length === 0) return { found: false }

        const profile = resultsData[0]
        const description = profile.Description || profile.description || ''

        if (!description) {
          console.error(`❌ No description found in YouTube data for: ${username}`)
          return { found: false, description: '' }
        }

        // Normalize both strings for comparison to handle whitespace, special chars
        const normalizedDescription = normalizeForComparison(description)
        const normalizedCode = normalizeForComparison(code)
        
        // Also try direct includes as a fallback
        const codeFoundNormalized = normalizedDescription.includes(normalizedCode)
        const codeFoundDirect = description.includes(code)
        // Also try case-insensitive direct match
        const codeFoundCaseInsensitive = description.toUpperCase().includes(code.toUpperCase())
        const codeFound = codeFoundNormalized || codeFoundDirect || codeFoundCaseInsensitive
        
        console.log(`YouTube description check for @${username}: ${codeFound ? '✅ FOUND' : '❌ NOT FOUND'}`)
        console.log(`📝 Description preview: "${description.substring(0, 200)}..."`)
        console.log(`📝 Description first 20 chars (hex): ${Buffer.from(description.substring(0, 20)).toString('hex')}`)
        console.log(`🔍 Looking for code: "${code}"`)
        console.log(`🔍 Code (hex): ${Buffer.from(code).toString('hex')}`)
        console.log(`🔍 Normalized description (first 50): "${normalizedDescription.substring(0, 50)}"`)
        console.log(`🔍 Normalized code: "${normalizedCode}"`)
        console.log(`🔍 Direct match: ${codeFoundDirect}, Case-insensitive: ${codeFoundCaseInsensitive}, Normalized: ${codeFoundNormalized}`)

        return { found: codeFound, description }

      } else if (runStatus === 'FAILED' || runStatus === 'ABORTED' || runStatus === 'TIMED-OUT') {
        console.error(`❌ YouTube Apify run failed: ${runStatus}`)
        break
      }
    }

    console.error(`❌ YouTube Apify run timed out`)
    return { found: false }

  } catch (error) {
    console.error(`❌ YouTube bio check failed for ${username}:`, error)
    return { found: false }
  }
}


// TikTok bio checking via Apify (abe/tiktok-profile-scraper)
async function checkTikTokBio(username: string, code: string): Promise<{ found: boolean; description?: string }> {
  try {
    const APIFY_API_KEY = process.env.APIFY_API_KEY
    if (!APIFY_API_KEY) {
      console.error('❌ APIFY_API_KEY not configured for TikTok')
      return { found: false }
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
      return { found: false }
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

        if (!resultsResponse.ok) return { found: false }

        const resultsData = await resultsResponse.json()
        if (!resultsData || resultsData.length === 0) return { found: false }

        const profile = resultsData[0]
        const bio = profile.bio || profile.description || profile.tagline || ''

        if (!bio) {
          console.error(`❌ No bio found in TikTok data for: ${username}`)
          return { found: false, description: '' }
        }

        // Use the same normalized matching as YouTube
        const normalizedBio = normalizeForComparison(bio)
        const normalizedCode = normalizeForComparison(code)
        
        const codeFoundNormalized = normalizedBio.includes(normalizedCode)
        const codeFoundDirect = bio.includes(code)
        const codeFoundCaseInsensitive = bio.toUpperCase().includes(code.toUpperCase())
        const codeFound = codeFoundNormalized || codeFoundDirect || codeFoundCaseInsensitive

        console.log(`TikTok bio check for @${username}: ${codeFound ? '✅ FOUND' : '❌ NOT FOUND'}`)
        console.log(`📝 Bio preview: "${bio.substring(0, 200)}..."`)
        console.log(`🔍 Looking for code: "${code}"`)
        console.log(`🔍 Direct match: ${codeFoundDirect}, Case-insensitive: ${codeFoundCaseInsensitive}, Normalized: ${codeFoundNormalized}`)

        return { found: codeFound, description: bio }

      } else if (runStatus === 'FAILED' || runStatus === 'ABORTED' || runStatus === 'TIMED-OUT') {
        console.error(`❌ TikTok Apify run failed: ${runStatus}`)
        break
      }
    }

    console.error(`❌ TikTok Apify run timed out`)
    return { found: false }

  } catch (error) {
    console.error(`❌ TikTok bio check failed for ${username}:`, error)
    return { found: false }
  }
}

// Twitter/X bio checking via Apify (fastcrawler/twitter-user-profile-fast-cheapest-scraper-2025)
async function checkTwitterBio(username: string, code: string): Promise<{ found: boolean; description?: string }> {
  try {
    const APIFY_API_KEY = process.env.APIFY_API_KEY
    
    if (!APIFY_API_KEY) {
      console.error('❌ APIFY_API_KEY not configured for Twitter/X')
      return { found: false }
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
      return { found: false }
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

        if (!resultsResponse.ok) return { found: false }

        const resultsData = await resultsResponse.json()
        if (!resultsData || resultsData.length === 0) return { found: false }

        // Check multiple profiles if returned (sometimes multiple users match)
        for (const profile of resultsData) {
          // Case-insensitive username matching
          const usernameMatch = profile.username?.toLowerCase() === username.toLowerCase() || 
                               profile.screenName?.toLowerCase() === username.toLowerCase()
          if (usernameMatch) {
            const description = profile.description || profile.bio || ''
            console.log(`✅ Found matching Twitter profile: @${profile.username || profile.screenName}`)

            if (!description) {
              console.error(`❌ No description found in Twitter data for: ${username}`)
              continue
            }

            // Use normalized matching
            const normalizedDesc = normalizeForComparison(description)
            const normalizedCode = normalizeForComparison(code)
            
            const codeFoundNormalized = normalizedDesc.includes(normalizedCode)
            const codeFoundDirect = description.includes(code)
            const codeFoundCaseInsensitive = description.toUpperCase().includes(code.toUpperCase())
            const codeFound = codeFoundNormalized || codeFoundDirect || codeFoundCaseInsensitive

            console.log(`Twitter bio check for @${username}: ${codeFound ? '✅ FOUND' : '❌ NOT FOUND'}`)
            console.log(`📝 Bio preview: "${description.substring(0, 200)}..."`)
            console.log(`🔍 Looking for code: "${code}"`)
            console.log(`🔍 Direct match: ${codeFoundDirect}, Case-insensitive: ${codeFoundCaseInsensitive}, Normalized: ${codeFoundNormalized}`)

            if (codeFound) {
              return { found: true, description }
            } else {
              // Return the description even on failure for debugging
              return { found: false, description }
            }
          }
        }

        console.error(`❌ No matching Twitter profile found for: ${username}`)
        return { found: false }

      } else if (runStatus === 'FAILED' || runStatus === 'ABORTED' || runStatus === 'TIMED-OUT') {
        console.error(`❌ Twitter Apify run failed: ${runStatus}`)
        break
      }
    }

    console.error(`❌ Twitter Apify run timed out`)
    return { found: false }

  } catch (error) {
    console.error(`❌ Twitter bio check failed for ${username}:`, error)
    return { found: false }
  }
}


async function checkInstagramBio(username: string, code: string): Promise<{ found: boolean; description?: string }> {
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
      return { found: false }
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
          return { found: false }
        }

        const resultsData = await resultsResponse.json()

        if (!resultsData || resultsData.length === 0) {
          console.error(`❌ No profile data returned from Apify for: ${username}`)
          return { found: false }
        }

        const profile = resultsData[0]
        const bio = profile.biography || profile.bio || profile.description || ''

        if (!bio) {
          console.error(`❌ No bio found in Apify data for: ${username}`)
          return { found: false, description: '' }
        }

        // Decode Unicode escape sequences
        const decodedBio = bio.replace(/\\u[\dA-Fa-f]{4}/gi, (match: string) => {
          return String.fromCharCode(parseInt(match.replace('\\u', ''), 16))
        })

        // Use normalized matching
        const normalizedBio = normalizeForComparison(decodedBio)
        const normalizedCode = normalizeForComparison(code)
        
        const codeFoundNormalized = normalizedBio.includes(normalizedCode)
        const codeFoundDirect = decodedBio.includes(code)
        const codeFoundCaseInsensitive = decodedBio.toUpperCase().includes(code.toUpperCase())
        const codeFound = codeFoundNormalized || codeFoundDirect || codeFoundCaseInsensitive

        console.log(`📝 Bio extracted via Apify: "${decodedBio.substring(0, 100)}${decodedBio.length > 100 ? '...' : ''}"`)
        console.log(`🔍 Looking for code: "${code}"`)
        console.log(`🔍 Direct match: ${codeFoundDirect}, Case-insensitive: ${codeFoundCaseInsensitive}, Normalized: ${codeFoundNormalized}`)
        console.log(`Instagram bio check for @${username}: ${codeFound ? '✅ FOUND' : '❌ NOT FOUND'}`)

        return { found: codeFound, description: decodedBio }

      } else if (runStatus === 'FAILED' || runStatus === 'ABORTED' || runStatus === 'TIMED-OUT') {
        console.error(`❌ Apify run failed with status: ${runStatus}`)
        break
      }

      // Continue waiting if still running
    }

    console.error(`❌ Apify run timed out after ${maxWaitTime/1000} seconds`)
    return { found: false }

  } catch (error) {
    console.error(`❌ Apify Instagram bio check failed for ${username}:`, error)
    return await checkInstagramBioManual(username, code)
  }
}

// Fallback manual scraping function
async function checkInstagramBioManual(username: string, code: string): Promise<{ found: boolean; description?: string }> {
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
        return { found: false }
      }
      if (response.status === 404) {
        console.log(`Profile not found: ${username}`)
        return { found: false }
      }
      if (response.status === 403) {
        console.log(`Access forbidden for profile: ${username} - may be private or restricted`)
        return { found: false }
      }
      return { found: false }
    }

    const html = await response.text()
    console.log(`✅ Successfully fetched Instagram page (${html.length} characters)`)

    // Enhanced patterns for extracting bio/description
    const patterns = [
      // New Instagram GraphQL patterns (2024)
      /"biography":"([^"]*(?:\.[^"]*)*)"/,
      /"description":"([^"]*(?:\.[^"]*)*)"/,
      /"bio":"([^"]*(?:\.[^"]*)*)"/,

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
        return { found: false }
      }
      if (html.includes('User not found') || html.includes('Page Not Found')) {
        console.log(`❌ Account does not exist: ${username}`)
        return { found: false }
      }
      if (html.includes('challenge') || html.includes('checkpoint')) {
        console.log(`❌ Instagram is challenging our request - may need different approach`)
        return { found: false }
      }
      return { found: false }
    }

    // Decode Unicode escape sequences and HTML entities
    let decodedBio = bio
      .replace(/\\u[\dA-Fa-f]{4}/gi, (match: string) => {
        return String.fromCharCode(parseInt(match.replace('\\u', ''), 16))
      })
      .replace(/\\n/g, ' ')
      .replace(/\\t/g, ' ')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')

    // Use normalized matching
    const normalizedBio = normalizeForComparison(decodedBio)
    const normalizedCode = normalizeForComparison(code)
    
    const codeFoundNormalized = normalizedBio.includes(normalizedCode)
    const codeFoundDirect = decodedBio.includes(code)
    const codeFoundCaseInsensitive = decodedBio.toUpperCase().includes(code.toUpperCase())
    const codeFound = codeFoundNormalized || codeFoundDirect || codeFoundCaseInsensitive

    console.log(`📝 Bio extracted (pattern ${patternUsed + 1}): "${decodedBio.substring(0, 100)}${decodedBio.length > 100 ? '...' : ''}"`)
    console.log(`🔍 Looking for code: "${code}"`)
    console.log(`🔍 Direct match: ${codeFoundDirect}, Case-insensitive: ${codeFoundCaseInsensitive}, Normalized: ${codeFoundNormalized}`)
    console.log(`Instagram bio check for @${username}: ${codeFound ? '✅ FOUND' : '❌ NOT FOUND'}`)

    return { found: codeFound, description: decodedBio }

  } catch (error) {
    console.error(`❌ Manual Instagram bio check failed for ${username}:`, error)
    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        console.log(`🔄 Request timed out for ${username}`)
      } else if (error.name === 'TypeError') {
        console.log(`🔄 Network error for ${username}`)
      }
    }
    return { found: false }
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
    let foundDescription = "" // Store the actual description we found for debugging

    switch (platform.toLowerCase()) {
      case 'instagram':
        logs.push(`📸 Checking Instagram bio via Apify for @${cleanUsername}`)
        const instagramResult = await checkInstagramBio(cleanUsername, verificationCode)
        codeFound = instagramResult.found
        foundDescription = instagramResult.description || ''
        if (codeFound) {
          bio = verificationCode
        }
        break

      case 'youtube':
        logs.push(`📺 Checking YouTube bio via Apify for @${cleanUsername}`)
        const youtubeResult = await checkYouTubeBio(cleanUsername, verificationCode)
        codeFound = youtubeResult.found
        foundDescription = youtubeResult.description || ''
        if (codeFound) {
          bio = verificationCode
        }
        break

      case 'twitter':
      case 'x':
        logs.push(`🐦 Checking Twitter bio via Apify for @${cleanUsername}`)
        const twitterResult = await checkTwitterBio(cleanUsername, verificationCode)
        codeFound = twitterResult.found
        foundDescription = twitterResult.description || ''
        if (codeFound) {
          bio = verificationCode
        }
        break

      case 'tiktok':
        logs.push(`🎵 Checking TikTok bio via Apify for @${cleanUsername}`)
        const tiktokResult = await checkTikTokBio(cleanUsername, verificationCode)
        codeFound = tiktokResult.found
        foundDescription = tiktokResult.description || ''
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
      if (foundDescription) {
        logs.push(`📝 Found description (first 100 chars): "${foundDescription.substring(0, 100)}..."`)
        logs.push(`🔍 Looking for code: "${verificationCode}"`)
      }
      logs.push(`📋 Final logs summary:`)
      logs.forEach((log, index) => {
        logs.push(`  ${index + 1}. ${log}`)
      })

      // Build a helpful error message
      let errorMessage = `Code "${verificationCode}" not found in @${cleanUsername}'s bio.`
      let hint = ''
      
      if (foundDescription) {
        // Check if there's another code-like pattern in the description (6 alphanumeric characters)
        const possibleOldCode = foundDescription.match(/\b[A-Z0-9]{6}\b/)
        if (possibleOldCode && possibleOldCode[0] !== verificationCode) {
          errorMessage = `Your bio contains "${possibleOldCode[0]}" but we're looking for "${verificationCode}".`
          hint = 'Please update your bio with the current code and wait 2-3 minutes for YouTube to update before trying again.'
        } else if (!possibleOldCode) {
          hint = 'Make sure you added the code exactly as shown (6 characters, uppercase).'
        }
      } else {
        hint = 'YouTube may be caching old data. Please wait 2-3 minutes after updating your description and try again.'
      }

      return NextResponse.json({
        success: false,
        verified: false,
        error: errorMessage,
        hint: hint,
        message: `❌ ${errorMessage}${hint ? ' ' + hint : ''}`,
        logs,
        bio: bio.substring(0, 500),
        foundDescription: foundDescription ? foundDescription.substring(0, 300) : undefined,
        platform: platform,
        username: cleanUsername,
        expectedCode: verificationCode,
        debugInfo: {
          codeSearched: verificationCode,
          foundDescription: foundDescription ? foundDescription.substring(0, 300) : undefined,
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
