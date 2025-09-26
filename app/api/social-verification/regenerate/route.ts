import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const { platform } = await request.json()

    if (!platform || !['instagram', 'youtube', 'tiktok', 'twitter'].includes(platform)) {
      return NextResponse.json(
        { error: "Invalid platform" },
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

    // Delete all existing unverified codes for this platform
    const deletedCount = await prisma.socialVerification.deleteMany({
      where: {
        userId: session.user.id,
        platform: platformEnum as any,
        verified: false
      }
    })

    console.log(`🔄 Deleted ${deletedCount.count} existing verification(s) for user ${session.user.id} on ${platform}`)

    return NextResponse.json({
      success: true,
      message: `Cleared pending verifications. You can now generate a new code.`,
      deletedCount: deletedCount.count
    })

  } catch (error) {
    console.error("Error clearing verification codes:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
