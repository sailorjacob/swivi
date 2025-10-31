// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const { user, error } = await getServerUserWithRole(request)

    if (!user || error) {
      console.log("❌ Clip Analytics API: No authenticated user or error:", {
        hasUser: !!user,
        userId: user?.id,
        error: error?.message,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ error: "No authenticated user" }, { status: 401 })
    }

    console.log("✅ Clip Analytics API: Valid session for user", user.id)

    // Get clipId from query params
    const { searchParams } = new URL(request.url)
    const clipId = searchParams.get('clipId')

    if (!clipId) {
      return NextResponse.json({ error: 'clipId is required' }, { status: 400 })
    }

    // Get user from database to verify ownership
    console.log("🔍 Looking up database user for supabaseAuthId:", user.id)
    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id }
    })

    if (!dbUser) {
      console.log("❌ Database user not found for supabaseAuthId:", user.id)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log("✅ Found database user:", dbUser.id)

    // Fetch clip submission first to verify ownership, then get clip data
    console.log("🔍 Looking up clip submission for clip:", clipId, "for user:", dbUser.id)
    const submission = await prisma.clipSubmission.findFirst({
      where: {
        clipId: clipId,
        userId: dbUser.id
      },
      select: {
        id: true,
        status: true,
        initialViews: true,
        finalEarnings: true,
        createdAt: true,
        campaigns: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    })

    if (!submission) {
      console.log("❌ Submission not found or unauthorized:", clipId, "for user:", dbUser.id)
      return NextResponse.json({ error: 'Clip not found or unauthorized' }, { status: 404 })
    }

    console.log("✅ Found submission:", submission.id)

    // Now fetch the actual clip with view history
    console.log("🔍 Looking up clip data:", clipId)
    const clip = await prisma.clip.findUnique({
      where: {
        id: clipId
      },
      select: {
        id: true,
        url: true,
        platform: true,
        status: true,
        views: true,
        createdAt: true,
        earnings: true,
        view_tracking: {
          orderBy: {
            createdAt: 'asc'
          },
          select: {
            id: true,
            views: true,
            createdAt: true
          }
        }
      }
    })

    if (!clip) {
      console.log("❌ Clip data not found:", clipId)
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 })
    }

    console.log("✅ Found clip:", clip.id, "with", clip.view_tracking?.length || 0, "tracking records")

    // Format view history
    const viewHistory = (clip.view_tracking || []).map((track: any) => ({
      date: new Date(track.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views: Number(track.views || 0),
      scrapedAt: track.createdAt,
      success: Number(track.views) > 0 || clip.view_tracking.indexOf(track) > 0
    }))

    // Calculate tracked views (current - initial)
    const initialViews = Number(submission.initialViews || 0)
    const currentViews = Number(clip.views || 0)
    const trackedViews = currentViews - initialViews

    console.log(`📊 Returning analytics for clip ${clipId} for user ${user.id}`)
    
    return NextResponse.json({
      success: true,
      clip: {
        id: clip.id,
        clipUrl: clip.url,
        platform: clip.platform,
        status: clip.status,
        initialViews: initialViews,
        currentViews: currentViews,
        trackedViews: trackedViews > 0 ? trackedViews : 0,
        createdAt: clip.createdAt,
        earnings: Number(clip.earnings || 0),
        campaign: submission.campaigns || null,
        submission: submission || null,
        viewHistory
      }
    })

  } catch (error) {
    console.error('Error in clip analytics API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
