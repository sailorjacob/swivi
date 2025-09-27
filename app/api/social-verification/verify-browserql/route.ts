import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { platform, username, code } = await request.json()

    if (!platform || !username || !code) {
      return NextResponse.json({
        error: "Missing required fields: platform, username, code"
      }, { status: 400 })
    }

    const logs: string[] = []
    logs.push(`🤖 Starting browserql verification for @${username} on ${platform}`)
    logs.push(`🔑 Looking for code: ${code}`)

    // Redirect to our main verify endpoint which uses working Apify integration
    try {
      const verifyResponse = await fetch(`${request.nextUrl.origin}/api/social-verification/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('authorization') || ''
        },
        body: JSON.stringify({
          platform,
          username,
          displayName: `@${username}`
        })
      })

      if (verifyResponse.ok) {
        const verifyResult = await verifyResponse.json()
        logs.push(`✅ Main verification endpoint succeeded`)
        logs.push(`🔄 Returning result from main verification system`)

        return NextResponse.json({
          success: verifyResult.success,
          verified: verifyResult.success,
          message: verifyResult.message || verifyResult.error,
          logs: [...logs, ...verifyResult.logs || []],
          bio: verifyResult.bio || '',
          platform: verifyResult.platform,
          username: verifyResult.username
        })
      } else {
        const errorData = await verifyResponse.json()
        logs.push(`❌ Main verification failed: ${errorData.error}`)

        return NextResponse.json({
          success: false,
          verified: false,
          error: `Verification failed: ${errorData.error}`,
          message: `❌ ${errorData.error}`,
          logs,
          bio: '',
          platform,
          username
        }, { status: 400 })
      }
    } catch (fetchError) {
      logs.push(`❌ Failed to call main verification endpoint: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`)

      return NextResponse.json({
        success: false,
        error: "Failed to connect to verification service",
        logs: [`❌ Network error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`]
      }, { status: 500 })
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
