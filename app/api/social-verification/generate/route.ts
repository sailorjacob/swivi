import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Generate a random 6-character alphanumeric code
function generateVerificationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
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

    // Get platform name for displayName fallback
    const platformNames: Record<string, string> = {
      instagram: 'Instagram',
      youtube: 'YouTube',
      tiktok: 'TikTok',
      twitter: 'X (Twitter)'
    }
    const platformName = platformNames[platform] || platform

    // Map platform strings to enum values
    const platformMap: Record<string, string> = {
      instagram: 'INSTAGRAM',
      youtube: 'YOUTUBE',
      tiktok: 'TIKTOK',
      twitter: 'TWITTER'
    }
    
    const platformEnum = platformMap[platform.toLowerCase()]
    
    // Check if user already has 5 verified accounts for this platform
    const verifiedCount = await prisma.socialAccount.count({
      where: {
        userId: session.user.id,
        platform: platformEnum as any,
        verified: true
      }
    })

    if (verifiedCount >= 5) {
      return NextResponse.json(
        { error: `You can only have up to 5 verified ${platform} accounts` },
        { status: 400 }
      )
    }

    // Check if user already has a pending verification for this platform
    const existingVerification = await prisma.socialVerification.findFirst({
      where: {
        userId: session.user.id,
        platform: platformEnum as any,
        verified: false,
        expiresAt: {
          gt: new Date()
        }
      }
    })

    if (existingVerification) {
      return NextResponse.json({
        code: existingVerification.code,
        expiresAt: existingVerification.expiresAt,
        platform: existingVerification.platform,
        username: username
      })
    }

    // Generate new code
    const code = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create verification record
    console.log(`🎯 Creating verification: userId=${session.user.id}, platform=${platformEnum}, code=${code}, username=${username}`)
    
    const verification = await prisma.socialVerification.create({
      data: {
        userId: session.user.id,
        platform: platformEnum as any,
        code: code,
        expiresAt: expiresAt,
        verified: false
      }
    })
    
    console.log(`✅ Verification created:`, { id: verification.id, platform: verification.platform, code: verification.code })

    return NextResponse.json({
      code: verification.code,
      expiresAt: verification.expiresAt,
      platform: verification.platform,
      username: username,
      displayName: displayName || platformName
    })

  } catch (error) {
    console.error("Error generating verification code:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
