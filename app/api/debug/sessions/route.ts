// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { BrowserSessionManager } from "@/lib/browser-sessions"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const platform = searchParams.get('platform')

    if (action === 'clear' && platform) {
      await BrowserSessionManager.clearSession(platform)
      return NextResponse.json({
        message: `Cleared session for ${platform}`,
        platform: platform
      })
    }

    if (action === 'clear_all') {
      const stats = BrowserSessionManager.getSessionStats()
      for (const session of stats) {
        await BrowserSessionManager.clearSession(session.platform)
      }
      return NextResponse.json({
        message: `Cleared ${stats.length} sessions`,
        cleared_platforms: stats.map(s => s.platform)
      })
    }

    // Default: show session statistics
    const stats = BrowserSessionManager.getSessionStats()
    
    return NextResponse.json({
      message: "Browser session statistics",
      total_sessions: stats.length,
      sessions: stats.map(session => ({
        platform: session.platform,
        last_used: session.lastUsed,
        expires_at: session.expiresAt,
        is_expired: new Date() > session.expiresAt,
        age_hours: Math.round((Date.now() - session.lastUsed.getTime()) / (1000 * 60 * 60))
      })),
      actions: {
        clear_platform: "/api/debug/sessions?action=clear&platform=PLATFORM_NAME",
        clear_all: "/api/debug/sessions?action=clear_all"
      }
    })

  } catch (error) {
    console.error("Session debug error:", error)
    return NextResponse.json({
      error: "Failed to get session information",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
