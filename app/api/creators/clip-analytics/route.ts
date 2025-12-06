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

    // Get submissionId from query params (dashboard passes submission.id as clip.id)
    const { searchParams } = new URL(request.url)
    const submissionId = searchParams.get('clipId') // frontend sends as clipId but it's actually submissionId

    if (!submissionId) {
      return NextResponse.json({ error: 'submissionId is required' }, { status: 400 })
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

    // Fetch clip submission by submissionId to verify ownership
    console.log("🔍 Looking up submission:", submissionId, "for user:", dbUser.id)
    const submission = await prisma.clipSubmission.findFirst({
      where: {
        id: submissionId,
        userId: dbUser.id
      },
      select: {
        id: true,
        clipId: true,
        clipUrl: true,
        platform: true,
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
      console.log("❌ Submission not found or unauthorized:", submissionId, "for user:", dbUser.id)
      return NextResponse.json({ error: 'Clip not found or unauthorized' }, { status: 404 })
    }

    console.log("✅ Found submission:", submission.id, "with clipId:", submission.clipId)

    // If no clip is linked, return early with submission data only
    if (!submission.clipId) {
      console.log("⚠️ Submission has no linked clip")
      return NextResponse.json({
        success: true,
        clip: {
          id: submission.id,
          clipUrl: submission.clipUrl || '',
          platform: submission.platform || 'UNKNOWN',
          status: submission.status || 'PENDING',
          initialViews: Number(submission.initialViews || 0),
          currentViews: Number(submission.initialViews || 0),
          trackedViews: 0,
          createdAt: submission.createdAt.toISOString(),
          earnings: Number(submission.finalEarnings || 0),
          campaign: submission.campaigns || null,
          viewHistory: []
        }
      })
    }

    // Now fetch the actual clip with view history
    console.log("🔍 Looking up clip data:", submission.clipId)
    const clip = await prisma.clip.findUnique({
      where: {
        id: submission.clipId
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
      console.log("❌ Clip data not found:", submission.clipId)
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

    console.log(`📊 Returning analytics for submission ${submissionId} (clip ${clip.id}) for user ${user.id}`)
    
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
        createdAt: clip.createdAt.toISOString(),
        earnings: Number(clip.earnings || 0),
        campaign: submission.campaigns || null,
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
