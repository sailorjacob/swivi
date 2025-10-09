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
    }

    const { platform, username, displayName, bypassCheck } = await request.json()

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

    // Find the latest verification for this platform and user
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
      return NextResponse.json(
        { error: "No pending verification found. Please generate a new code first." },
        { status: 404 }
      )
    }

    // If bypass is enabled (for testing/rate limit issues), skip the bio check
    let codeFound = false
    if (bypassCheck) {
      console.log(`🔧 Manual verification bypass enabled for ${platform}/@${username}`)
      codeFound = true
    } else {
      // Note: Bio checking temporarily disabled due to rate limiting
      // In production, you would implement the bio check here
      return NextResponse.json(
        { 
          error: `Instagram verification temporarily unavailable due to rate limiting. Please try again in 1 hour or contact support.`,
          code: verification.code,
          instructions: [
            `Add this code to your ${platformName} bio: ${verification.code}`,
            `Manual verification: Contact support with your username and code`,
            `Rate limit resets automatically in 1-24 hours`
          ]
        },
        { status: 503 }
      )
    }

    if (codeFound) {
      // Mark as verified and create/update social account
      await prisma.socialVerification.update({
        where: { id: verification.id },
        data: { verified: true, verifiedAt: new Date() }
      })

      // Check if account already exists
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
        // Create new account
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
        message: `Successfully verified ${platform} account!`,
        platform: platform,
        username: username
      })
    }

    return NextResponse.json(
      { error: "Verification failed" },
      { status: 400 }
    )

  } catch (error) {
    console.error("Error in manual verification:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
