// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const APIFY_API_KEY = process.env.APIFY_API_KEY
    
    if (!APIFY_API_KEY) {
      return NextResponse.json({
        success: false,
        error: "APIFY_API_KEY not configured"
      }, { status: 500 })
    }

    const logs: string[] = []
    logs.push(`🔑 API Key present: ${!!APIFY_API_KEY}`)
    logs.push(`🔑 API Key length: ${APIFY_API_KEY.length}`)
    logs.push(`🔑 API Key preview: ${APIFY_API_KEY.substring(0, 12)}...`)

    // Test 1: Get user info
    logs.push(`👤 Testing user info endpoint...`)
    const userResponse = await fetch('https://api.apify.com/v2/users/me', {
      headers: {
        'Authorization': `Bearer ${APIFY_API_KEY}`
      }
    })

    logs.push(`📊 User response: ${userResponse.status} ${userResponse.statusText}`)

    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      logs.push(`❌ User info failed: ${errorText}`)
      return NextResponse.json({
        success: false,
        error: `API key invalid: ${userResponse.status}`,
        logs
      }, { status: 401 })
    }

    const userData = await userResponse.json()
    logs.push(`✅ User: ${userData.username} (${userData.plan})`)

    // Test 2: List actors
    logs.push(`🎭 Testing actors list...`)
    const actorsResponse = await fetch('https://api.apify.com/v2/acts?limit=5', {
      headers: {
        'Authorization': `Bearer ${APIFY_API_KEY}`
      }
    })

    logs.push(`📊 Actors response: ${actorsResponse.status} ${actorsResponse.statusText}`)

    if (actorsResponse.ok) {
      const actorsData = await actorsResponse.json()
      logs.push(`✅ Found ${actorsData.total} actors`)
    }

    // Test 3: Check specific Twitter actor
    logs.push(`🐦 Testing Twitter actor access...`)
    const twitterActorResponse = await fetch('https://api.apify.com/v2/acts/fastcrawler~twitter-user-profile-fast-cheapest-scraper-2025', {
      headers: {
        'Authorization': `Bearer ${APIFY_API_KEY}`
      }
    })

    logs.push(`📊 Twitter actor response: ${twitterActorResponse.status} ${twitterActorResponse.statusText}`)

    if (twitterActorResponse.ok) {
      const actorData = await twitterActorResponse.json()
      logs.push(`✅ Twitter actor: ${actorData.data.name}`)
      logs.push(`📋 Total runs: ${actorData.data.stats?.totalRuns || 0}`)
      logs.push(`📋 Last run: ${actorData.data.stats?.lastRunStartedAt || 'never'}`)
    } else {
      const errorText = await twitterActorResponse.text()
      logs.push(`❌ Twitter actor error: ${errorText}`)
    }

    return NextResponse.json({
      success: true,
      user: userData,
      logs
    })

  } catch (error) {
    console.error('Apify key test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
