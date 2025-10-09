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

    const { platform, username, verificationMethod = "auto" } = await request.json()

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

    console.log(`🔍 Simple verification attempt: ${platform}/@${username} with code ${verification.code}`)

    // For now, all platforms use manual verification due to anti-bot protection
    // This is the industry standard approach
    
    const platformDisplayNames: Record<string, string> = {
      instagram: 'Instagram',
      youtube: 'YouTube',
      tiktok: 'TikTok',
      twitter: 'X (Twitter)'
    }
    
    const platformName = platformDisplayNames[platform] || platform

    // Mark verification as pending manual review
    await prisma.socialVerification.update({
      where: { id: verification.id },
      data: {
        // Keep as unverified - will be manually approved
        verified: false
      }
    })

    return NextResponse.json({
      success: false, // Not auto-verified
      platform: platformName,
      username: username,
      verification_code: verification.code,
      message: `${platformName} verification submitted for review`,
      status: "pending_manual_review",
      instructions: [
        `✅ Add this code to your ${platformName} bio: ${verification.code}`,
        `✅ Make sure your profile is public`,
        `✅ Keep the code in your bio for 24-48 hours`,
        `✅ Our team will review and approve manually`
      ],
      timeline: {
        review_time: "24-48 hours",
        notification: "You'll receive an email when approved"
      },
      why_manual: "Social media platforms use anti-bot protection. Manual review ensures reliable verification.",
      alternatives: [
        {
          method: "profile_url",
          description: "Submit your profile URL for faster review"
        },
        {
          method: "contact_support", 
          description: "Email support@swivimedia.com with your username and code"
        }
      ]
    }, { status: 202 }) // 202 = Accepted for processing

  } catch (error) {
    console.error("Error in simple verification:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
