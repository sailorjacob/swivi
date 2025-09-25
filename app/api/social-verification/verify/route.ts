import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Mock function to check if verification code exists in social media bio
// In production, this would integrate with platform APIs
async function checkCodeInBio(platform: string, username: string, code: string): Promise<boolean> {
  try {
    // This is a mock implementation
    // In production, you would:
    // 1. Use Instagram Basic Display API for Instagram
    // 2. Use YouTube Data API for YouTube
    // 3. Use TikTok API for TikTok
    // 4. Use Twitter API for X/Twitter

    console.log(`🔍 Checking ${platform} profile for user: ${username} with code: ${code}`)

    // For now, we'll simulate a successful check
    // In reality, you'd make API calls to the respective platforms
    return true

  } catch (error) {
    console.error(`Error checking ${platform} bio:`, error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const { platform, username, displayName } = await request.json()

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

    // Find the latest unverified code for this platform and user
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
      return NextResponse.json(
        { error: "No pending verification found. Please generate a new code." },
        { status: 404 }
      )
    }

    // Check if the code exists in the user's bio
    const codeFound = await checkCodeInBio(platform, username, verification.code)

    if (codeFound) {
      // Mark as verified and create/update social account
      await prisma.socialVerification.update({
        where: { id: verification.id },
        data: { verified: true, verifiedAt: new Date() }
      })

      // Check if account already exists (since we allow multiple accounts per platform)
      const existingAccount = await prisma.socialAccount.findFirst({
        where: {
          userId: session.user.id,
          platform: platformEnum as any,
          username: username
        }
      })

      if (existingAccount) {
        // Update existing account
        await prisma.socialAccount.update({
          where: { id: existingAccount.id },
          data: {
            displayName: displayName || platformName,
            verified: true,
            verifiedAt: new Date()
          }
        })
      } else {
        // Create new account
        await prisma.socialAccount.create({
          data: {
            userId: session.user.id,
            platform: platformEnum as any,
            username: username,
            displayName: displayName || platformName,
            platformId: `${platform}_${username}_${Date.now()}`, // Generate unique platform ID
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
    } else {
      return NextResponse.json(
        {
          success: false,
          error: `Verification code ${verification.code} not found in your ${platform} bio. Please add it and try again.`
        },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error("Error verifying social account:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
