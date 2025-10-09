import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
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

    const { platform, username, testMode = false } = await request.json()

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

    // Find the latest verification for this platform and user
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

    // If no verification exists, create one for testing
    if (!verification) {
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
    }

    if (testMode) {
      console.log(`🧪 TEST MODE: Auto-approving ${platform}/@${username}`)
      
      // Mark as verified in test mode
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

      if (existingAccount && !existingAccount.verified) {
        await prisma.socialAccount.update({
          where: { id: existingAccount.id },
          data: {
            verified: true,
            verifiedAt: new Date()
          }
        })
      } else if (!existingAccount) {
        await prisma.socialAccount.create({
          data: {
            userId: dbUser.id,
            platform: platformEnum as any,
            username: username,
            displayName: platform.charAt(0).toUpperCase() + platform.slice(1),
            platformId: `${platform}_${username}_${Date.now()}`,
            verified: true,
            verifiedAt: new Date()
          }
        })
      }

      return NextResponse.json({
        success: true,
        message: `✅ TEST MODE: ${platform} account verified!`,
        platform: platform,
        username: username,
        test_mode: true,
        note: "This was verified in test mode - use manual verification for production"
      })
    }

    // Regular mode - return pending manual verification
    return NextResponse.json({
      success: false,
      platform: platform,
      username: username,
      verification_code: verification.code,
      message: "Ready for manual verification",
      instructions: [
        `Add this code to your ${platform} bio: ${verification.code}`,
        "Contact support or wait for manual review",
        "For immediate testing, use testMode: true"
      ],
      test_mode_example: {
        platform: platform,
        username: username,
        testMode: true
      }
    }, { status: 202 })

  } catch (error) {
    console.error("Error in test verification:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
