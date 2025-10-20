// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const APIFY_API_KEY = process.env.APIFY_API_KEY
    
    console.log('🔍 Apify API Key check:', {
      hasKey: !!APIFY_API_KEY,
      keyLength: APIFY_API_KEY?.length,
      keyPreview: APIFY_API_KEY ? `${APIFY_API_KEY.substring(0, 8)}...` : 'none'
    })

    if (!APIFY_API_KEY) {
      return NextResponse.json({
        success: false,
        error: "APIFY_API_KEY environment variable not configured",
        debug: {
          hasKey: false,
          message: "Add APIFY_API_KEY to your environment variables"
        }
      }, { status: 500 })
    }

    // Test a simple Apify API call to verify the key works
    console.log('🧪 Testing Apify API key with a simple request...')
    
    const testResponse = await fetch('https://api.apify.com/v2/users/me', {
      headers: {
        'Authorization': `Bearer ${APIFY_API_KEY}`
      }
    })

    console.log('📊 Apify API test response:', {
      status: testResponse.status,
      statusText: testResponse.statusText,
      ok: testResponse.ok
    })

    if (!testResponse.ok) {
      const errorText = await testResponse.text()
      console.log('❌ Apify API test failed:', errorText)
      
      return NextResponse.json({
        success: false,
        error: `Invalid Apify API key: ${testResponse.status} ${testResponse.statusText}`,
        debug: {
          hasKey: true,
          keyPreview: `${APIFY_API_KEY.substring(0, 8)}...`,
          apiResponse: {
            status: testResponse.status,
            statusText: testResponse.statusText,
            error: errorText
          }
        }
      }, { status: 401 })
    }

    const userData = await testResponse.json()
    console.log('✅ Apify API key is valid!')

    // Test one of our specific actors
    console.log('🎭 Testing Twitter actor availability...')
    
    const actorResponse = await fetch('https://api.apify.com/v2/acts/fastcrawler~twitter-user-profile-fast-cheapest-scraper-2025', {
      headers: {
        'Authorization': `Bearer ${APIFY_API_KEY}`
      }
    })

    const actorAvailable = actorResponse.ok
    console.log('🐦 Twitter actor test:', {
      status: actorResponse.status,
      available: actorAvailable
    })

    return NextResponse.json({
      success: true,
      message: "Apify API key is configured and working!",
      debug: {
        hasKey: true,
        keyPreview: `${APIFY_API_KEY.substring(0, 8)}...`,
        keyValid: true,
        user: {
          username: userData.username,
          plan: userData.plan
        },
        actors: {
          twitterActorAvailable: actorAvailable
        }
      }
    })

  } catch (error) {
    console.error('Apify test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      debug: {
        errorType: error?.constructor?.name
      }
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const APIFY_API_KEY = process.env.APIFY_API_KEY
    
    if (!APIFY_API_KEY) {
      return NextResponse.json({
        success: false,
        error: "APIFY_API_KEY not configured"
      }, { status: 500 })
    }

    const { platform, username } = await request.json()
    
    if (!platform || !username) {
      return NextResponse.json({
        success: false,
        error: "Missing platform or username"
      }, { status: 400 })
    }

    console.log(`🧪 Testing ${platform} actor with username: ${username}`)

    let actorUrl = ''
    let requestBody = {}

    switch (platform.toLowerCase()) {
      case 'twitter':
      case 'x':
        actorUrl = 'https://api.apify.com/v2/acts/fastcrawler~twitter-user-profile-fast-cheapest-scraper-2025/runs'
        requestBody = {
          "queryUser": [username],
          "shouldIncludeUserById": true,
          "shouldIncludeUserByScreenName": true,
          "maxItems": 1
        }
        break
      case 'instagram':
        actorUrl = 'https://api.apify.com/v2/acts/apify~instagram-profile-scraper/runs'
        requestBody = {
          "usernames": [username],
          "resultsPerPage": 1,
          "shouldDownloadCovers": false,
          "shouldDownloadSlideshowImages": false,
          "shouldDownloadVideos": false
        }
        break
      case 'youtube':
        actorUrl = 'https://api.apify.com/v2/acts/pratikdani~youtube-profile-scraper/runs'
        requestBody = {
          "url": `https://www.youtube.com/@${username}`
        }
        break
      case 'tiktok':
        actorUrl = 'https://api.apify.com/v2/acts/abe~tiktok-profile-scraper/runs'
        requestBody = {
          "usernames": [username],
          "tiktokSource": "user"
        }
        break
      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported platform: ${platform}`
        }, { status: 400 })
    }

    console.log(`🚀 Starting ${platform} actor run...`)
    
    const runResponse = await fetch(actorUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APIFY_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    })

    console.log(`📊 Actor run response:`, {
      status: runResponse.status,
      statusText: runResponse.statusText,
      ok: runResponse.ok
    })

    if (!runResponse.ok) {
      const errorText = await runResponse.text()
      console.log(`❌ Actor run failed:`, errorText)
      
      return NextResponse.json({
        success: false,
        error: `Actor run failed: ${runResponse.status} ${runResponse.statusText}`,
        debug: {
          platform,
          username,
          actorUrl,
          requestBody,
          response: {
            status: runResponse.status,
            statusText: runResponse.statusText,
            error: errorText
          }
        }
      }, { status: 500 })
    }

    const runData = await runResponse.json()
    console.log(`✅ Actor run started successfully:`, {
      runId: runData.data.id,
      datasetId: runData.data.defaultDatasetId
    })

    return NextResponse.json({
      success: true,
      message: `${platform} actor run started successfully!`,
      debug: {
        platform,
        username,
        actorUrl,
        runId: runData.data.id,
        datasetId: runData.data.defaultDatasetId,
        status: runData.data.status
      }
    })

  } catch (error) {
    console.error('Apify actor test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
