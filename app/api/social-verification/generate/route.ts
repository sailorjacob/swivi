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

    const { platform } = await request.json()

    if (!platform || !['instagram', 'youtube', 'tiktok', 'twitter'].includes(platform)) {
      return NextResponse.json(
        { error: "Invalid platform" },
        { status: 400 }
      )
    }

    // Check if user already has a pending verification for this platform
    const existingVerification = await prisma.socialVerification.findFirst({
      where: {
        userId: session.user.id,
        platform: platform as any,
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
        platform: existingVerification.platform
      })
    }

    // Generate new code
    const code = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create verification record
    const verification = await prisma.socialVerification.create({
      data: {
        userId: session.user.id,
        platform: platform as any,
        code: code,
        expiresAt: expiresAt,
        verified: false
      }
    })

    return NextResponse.json({
      code: verification.code,
      expiresAt: verification.expiresAt,
      platform: verification.platform
    })

  } catch (error) {
    console.error("Error generating verification code:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
