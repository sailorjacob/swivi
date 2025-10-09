import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    console.log("🔧 Test verification endpoint called")

    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      console.log("❌ No user found in test verify")
      return NextResponse.json(
        { 
          error: "Not authenticated - please log in first",
          login_url: "https://www.swivimedia.com/clippers/login",
          session_status: "missing"
        }

    // Get the database user ID
    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { id: true }
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      )
    },
        { status: 401 }
      )
    }

    console.log("✅ User found:", user.id)

    const { platform, username, displayName, testMode } = await request.json()

    if (!platform || !['instagram', 'youtube', 'tiktok', 'twitter'].includes(platform)) {
      return NextResponse.json(
        { error: "Invalid platform" },
        { status: 400 }
      )
    }

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      )
    }

    // Map platform strings to enum values
    const platformMap: Record<string, string> = {
      instagram: 'INSTAGRAM',
      youtube: 'YOUTUBE',
      tiktok: 'TIKTOK',
      twitter: 'TWITTER'
    }
    
    const platformEnum = platformMap[platform.toLowerCase()]
    
    // Get platform name for displayName fallback
    const platformNames: Record<string, string> = {
      instagram: 'Instagram',
      youtube: 'YouTube',
      tiktok: 'TikTok',
      twitter: 'X (Twitter)'
    }
    const platformName = platformNames[platform] || platform

    // Find or create a verification code
    let verification = await prisma.socialVerification.findFirst({
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
      // Create a new verification code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase()
      verification = await prisma.socialVerification.create({
        data: {
          userId: dbUser.id,
          platform: platformEnum as any,
          code: code,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          verified: false
        }
      })
      console.log("✅ Created new verification code:", code)
    }

    // For testing purposes or when social media is blocked, skip bio check
    if (testMode) {
      console.log("🔧 Test mode enabled - bypassing bio check")
      
      // Mark as verified
      await prisma.socialVerification.update({
        where: { id: verification.id },
        data: { verified: true, verifiedAt: new Date() }
      })

      // Create or update social account
      const existingAccount = await prisma.socialAccount.findFirst({
        where: {
          userId: dbUser.id,
          platform: platformEnum as any,
          username: username
        }
      })

      if (existingAccount) {
        if (!existingAccount.verified) {
          await prisma.socialAccount.update({
            where: { id: existingAccount.id },
            data: {
              displayName: displayName || platformName,
              verified: true,
              verifiedAt: new Date()
            }
          })
        }
      } else {
        await prisma.socialAccount.create({
          data: {
            userId: dbUser.id,
            platform: platformEnum as any,
            username: username,
            displayName: displayName || platformName,
            platformId: `${platform}_${username}_${Date.now()}`,
            verified: true,
            verifiedAt: new Date()
          }
        })
      }

      return NextResponse.json({
        success: true,
        message: `Test verification successful for ${platform} account @${username}`,
        platform: platform,
        username: username,
        test_mode: true
      })
    }

    // Regular flow - provide instructions for manual verification
    return NextResponse.json({
      success: false,
      message: "Manual verification required due to social media rate limiting",
      instructions: {
        step1: `Add this code to your ${platformName} bio: ${verification.code}`,
        step2: `After adding the code, contact support or try again later`,
        step3: `For immediate testing, use testMode: true in request`,
        code: verification.code,
        platform: platformName,
        username: username
      },
      test_endpoint: {
        message: "For testing, you can use test mode",
        example: {
          platform: platform,
          username: username,
          testMode: true
        }
      }
    }, { status: 202 })

  } catch (error) {
    console.error("❌ Test verification failed:", error)
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
