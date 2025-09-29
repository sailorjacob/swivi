import { NextRequest, NextResponse } from "next/server"
import { ViewTrackingService } from "@/lib/view-tracking"

export async function POST(request: NextRequest) {
  try {
    // Check if APIFY_API_KEY is available
    const apifyToken = process.env.APIFY_API_KEY

    if (!apifyToken) {
      return NextResponse.json(
        { error: "Apify API key not configured" },
        { status: 500 }
      )
    }

    const viewTrackingService = new ViewTrackingService(apifyToken)

    // Update all platform views
    await viewTrackingService.updateAllPlatformViews()

    return NextResponse.json({
      success: true,
      message: "View tracking updated successfully"
    })

  } catch (error) {
    console.error("Error updating view tracking:", error)
    return NextResponse.json(
      { error: "Failed to update view tracking" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const apifyToken = process.env.APIFY_API_KEY

    if (!apifyToken) {
      return NextResponse.json(
        { error: "Apify API key not configured" },
        { status: 500 }
      )
    }

    // This endpoint can be used for manual testing
    const viewTrackingService = new ViewTrackingService(apifyToken)

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const testUrl = searchParams.get("testUrl")

    if (testUrl) {
      // Test scraping a single URL
      const scraper = new (await import("@/lib/apify-tiktok-scraper")).ApifyTikTokScraper(apifyToken)
      const result = await scraper.scrapeTikTokVideo(testUrl)

      return NextResponse.json({
        success: true,
        testResult: result
      })
    }

    return NextResponse.json({
      message: "View tracking API ready. Use POST to update all views or add ?testUrl=... to test a single URL."
    })

  } catch (error) {
    console.error("Error in view tracking GET:", error)
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    )
  }
}
