import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 SIMPLE VERIFY - Starting')
    
    const { user, error } = await getServerUserWithRole(request)
    if (!user?.id || error) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { id: true }
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 })
    }

    const { platform, username, code } = await request.json()

    if (!platform || !username) {
      return NextResponse.json({ 
        error: "Missing required fields: platform, username"
      }, { status: 400 })
    }

    const logs: string[] = []
    logs.push(`🤖 Starting verification for @${username} on ${platform}`)
    logs.push(`🔑 Provided code: ${code || 'none (will use database code)'}`)

    // Determine which code to use for verification
    let verificationCode = code

    if (!verificationCode) {
      const platformMap: Record<string, string> = {
        instagram: 'INSTAGRAM',
        youtube: 'YOUTUBE',
        tiktok: 'TIKTOK',
        twitter: 'TWITTER',
        x: 'TWITTER'
      }
      const platformEnum = platformMap[platform.toLowerCase()]

      const verification = await prisma.socialVerification.findFirst({
        where: {
          userId: dbUser.id,
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

    // For testing, just return success without actually checking the bio
    logs.push(`🎯 Mock verification successful!`)

    return NextResponse.json({
      success: true,
      verified: true,
      message: `✅ Mock verification successful! Code "${verificationCode}" for @${username} on ${platform}`,
      logs,
      platform: platform,
      username: username.replace('@', ''),
      mock: true
    })

  } catch (error) {
    console.error('Simple verify error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Verification failed",
      logs: [`❌ Error: ${error instanceof Error ? error.message : String(error)}`]
    }, { status: 500 })
  }
}
