import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get all verification records for this user
    const verifications = await prisma.socialVerification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    })

    // Get all social accounts for this user  
    const socialAccounts = await prisma.socialAccount.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    })

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      user,
      verifications: verifications.map(v => ({
        id: v.id,
        platform: v.platform,
        code: v.code,
        verified: v.verified,
        verifiedAt: v.verifiedAt,
        expiresAt: v.expiresAt,
        createdAt: v.createdAt,
        isExpired: v.expiresAt < new Date()
      })),
      socialAccounts,
      currentTime: new Date(),
    })

  } catch (error) {
    console.error("Debug verification error:", error)
    return NextResponse.json({ 
      error: "Debug failed", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
