// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
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

    const body = await request.json()
    const { platform, username, displayName, force } = body

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
    
    // No limit on verified accounts per platform - users can have as many as they need

    // Check if user already has a pending verification for this platform
    const existingVerification = await prisma.socialVerification.findFirst({
      where: {
        userId: dbUser.id,
        platform: platformEnum as any,
        verified: false,
        expiresAt: {
          gt: new Date()
        }
      }
    })

    if (existingVerification && !force) {
      return NextResponse.json({
        code: existingVerification.code,
        expiresAt: existingVerification.expiresAt,
        platform: existingVerification.platform,
        username: username,
        existing: true
      })
    }

    // Delete ALL existing unverified verifications for this user/platform if regenerating
    if (force || existingVerification) {
      const deletedCount = await prisma.socialVerification.deleteMany({
        where: {
          userId: dbUser.id,
          platform: platformEnum as any,
          verified: false
        }
      })
      console.log(`🔄 Deleted ${deletedCount.count} existing verification(s) for ${username} on ${platform}`)
    }

    if (existingVerification && !force) {
      return NextResponse.json({
        code: existingVerification.code,
        expiresAt: existingVerification.expiresAt,
        platform: existingVerification.platform,
        username: username,
        existing: true
      })
    }

    // Delete ALL existing unverified verifications for this user/platform if regenerating
    if (force || existingVerification) {
      const deletedCount = await prisma.socialVerification.deleteMany({
        where: {
          userId: dbUser.id,
          platform: platformEnum as any,
          verified: false
        }
      })
      console.log(`🔄 Deleted ${deletedCount.count} existing verification(s) for ${username} on ${platform}`)
    }

    // Generate new code
    const code = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create verification record
    const verification = await prisma.socialVerification.create({
      data: {
        userId: dbUser.id,
        platform: platformEnum as any,
        code: code,
        expiresAt: expiresAt,
        verified: false
      }
    })

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
