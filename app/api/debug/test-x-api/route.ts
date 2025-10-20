// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { XViewTrackingService } from "@/lib/x-view-tracking"

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing X API connection...')
    
    const viewTrackingService = new XViewTrackingService()
    
    // Test X API connection
    const isConnected = await viewTrackingService.testXApiConnection()
    
    if (!isConnected) {
      return NextResponse.json({
        success: false,
        error: "X API connection failed",
        message: "Please check your X API credentials in environment variables"
      }, { status: 500 })
    }

    // Get rate limit status
    const rateLimits = await viewTrackingService.getXApiRateLimit()

    return NextResponse.json({
      success: true,
      message: "X API connection successful",
      rateLimits: rateLimits ? {
        tweet_lookup: rateLimits.resources?.statuses?.['/statuses/show/:id'],
        user_lookup: rateLimits.resources?.users?.['/users/show/:id']
      } : null
    })

  } catch (error) {
    console.error("Error testing X API:", error)
    return NextResponse.json({
      success: false,
      error: "X API test failed",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tweetUrl } = await request.json()
    
    if (!tweetUrl) {
      return NextResponse.json({
        error: "Tweet URL is required"
      }, { status: 400 })
    }

    console.log(`🧪 Testing X API with tweet URL: ${tweetUrl}`)
    
    const viewTrackingService = new XViewTrackingService()
    
    // Test fetching metrics for a specific tweet
    const xApiClient = (viewTrackingService as any).xApiClient
    
    if (!xApiClient) {
      return NextResponse.json({
        success: false,
        error: "X API client not initialized",
        message: "Please check your X API credentials"
      }, { status: 500 })
    }

    const metrics = await xApiClient.getTweetMetrics(tweetUrl)
    
    if (!metrics) {
      return NextResponse.json({
        success: false,
        error: "Could not fetch tweet metrics",
        message: "Tweet may not exist, be private, or API credentials may be invalid"
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Successfully fetched tweet metrics",
      metrics: {
        tweetId: metrics.tweetId,
        impressions: metrics.impressionCount,
        likes: metrics.likeCount,
        retweets: metrics.retweetCount,
        replies: metrics.replyCount,
        quotes: metrics.quoteCount,
        bookmarks: metrics.bookmarkCount,
        author: metrics.authorUsername,
        createdAt: metrics.createdAt,
        text: metrics.text.substring(0, 100) + (metrics.text.length > 100 ? '...' : '')
      }
    })

  } catch (error) {
    console.error("Error testing tweet metrics:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch tweet metrics",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
