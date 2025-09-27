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

    if (!platform || !username) {
      return NextResponse.json({
        error: "Missing required fields: platform, username"
      }, { status: 400 })
    }

    const logs: string[] = []
    logs.push(`🤖 Starting browserql verification for @${username} on ${platform}`)
    logs.push(`🔑 Provided code: ${code || 'none (will use database code)'}`)

    // Determine which code to use for verification
    let verificationCode = code // Use provided code if available

    if (!verificationCode) {
      // If no code provided, find the latest unverified code from database
      const platformMap: Record<string, string> = {
        instagram: 'INSTAGRAM',
        youtube: 'YOUTUBE',
        tiktok: 'TIKTOK',
        twitter: 'TWITTER'
      }
      const platformEnum = platformMap[platform.toLowerCase()]

      const verification = await prisma.socialVerification.findFirst({
        where: {
          userId: session.user.id,
          platform: platformEnum as any,
          verified: false,
          expiresAt: {
            gt: new Date()
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      if (!verification) {
        logs.push(`❌ No pending verification found for ${platform}`)
        return NextResponse.json({
          success: false,
          error: "No pending verification found. Please generate a new code first.",
          logs
        }, { status: 404 })
      }

      verificationCode = verification.code
      logs.push(`✅ Using database verification code: ${verificationCode}`)
    } else {
      logs.push(`✅ Using provided verification code: ${verificationCode}`)
    }

    // Now call our main verify endpoint (it will find the verification code from database)
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
