// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerUserWithRole } from '@/lib/supabase-auth-server'

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await getServerUserWithRole(request)
    
    if (!authResult || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { user } = authResult

    // Get clipId from query params
    const { searchParams } = new URL(request.url)
    const clipId = searchParams.get('clipId')

    if (!clipId) {
      return NextResponse.json({ error: 'clipId is required' }, { status: 400 })
    }

    // Get user from database to verify ownership
    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch clip with view history - ensure user owns this clip
    const clip = await prisma.clip.findFirst({
      where: {
        id: clipId,
        userId: dbUser.id
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
        },
        clipSubmissions: {
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
        }
      }
    })

    if (!clip) {
      return NextResponse.json({ error: 'Clip not found or unauthorized' }, { status: 404 })
    }

    // Format view history
    const viewHistory = (clip.view_tracking || []).map((track: any) => ({
      date: new Date(track.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views: Number(track.views || 0),
      scrapedAt: track.createdAt,
      success: Number(track.views) > 0 || clip.view_tracking.indexOf(track) > 0
    }))

    // Calculate tracked views (current - initial)
    const initialViews = Number(clip.clipSubmissions?.[0]?.initialViews || 0)
    const currentViews = Number(clip.views || 0)
    const trackedViews = currentViews - initialViews

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
        campaign: clip.clipSubmissions?.[0]?.campaigns || null,
        submission: clip.clipSubmissions?.[0] || null,
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
