import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get session
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get clipId from query params
    const { searchParams } = new URL(request.url)
    const clipId = searchParams.get("clipId")

    if (!clipId) {
      return NextResponse.json({ error: "clipId is required" }, { status: 400 })
    }

    // Fetch clip with view history - ensure user owns this clip
    const { data: clip, error: clipError } = await supabase
      .from("clips")
      .select(`
        id,
        clipUrl,
        platform,
        status,
        initialViews,
        currentViews,
        createdAt,
        viewChanges,
        userId,
        campaigns (
          id,
          title,
          status
        ),
        submissions!inner (
          id,
          status,
          earnings,
          submittedAt
        )
      `)
      .eq("id", clipId)
      .eq("userId", user.id)
      .single()

    if (clipError || !clip) {
      return NextResponse.json({ error: "Clip not found or unauthorized" }, { status: 404 })
    }

    // Fetch view scrapes for this clip
    const { data: viewScrapes, error: scrapesError } = await supabase
      .from("view_scrapes")
      .select("*")
      .eq("clipId", clipId)
      .order("scrapedAt", { ascending: true })

    if (scrapesError) {
      console.error("Error fetching view scrapes:", scrapesError)
    }

    // Format view history
    const viewHistory = (viewScrapes || []).map((scrape: any) => ({
      date: new Date(scrape.scrapedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views: scrape.views || 0,
      scrapedAt: scrape.scrapedAt,
      success: scrape.success || false
    }))

    // Calculate tracked views (current - initial)
    const trackedViews = (clip.currentViews || 0) - (clip.initialViews || 0)

    return NextResponse.json({
      clip: {
        id: clip.id,
        clipUrl: clip.clipUrl,
        platform: clip.platform,
        status: clip.status,
        initialViews: clip.initialViews || 0,
        currentViews: clip.currentViews || 0,
        trackedViews: trackedViews > 0 ? trackedViews : 0,
        createdAt: clip.createdAt,
        campaign: clip.campaigns,
        submission: clip.submissions?.[0] || null,
        viewHistory
      }
    })

  } catch (error) {
    console.error("Error in clip analytics API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

