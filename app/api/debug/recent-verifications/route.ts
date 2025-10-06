import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // Get recent verification attempts (last 24 hours)
    const recentVerifications = await prisma.socialVerification.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      include: {
        users: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })

    // Get recent social account creations
    const recentSocialAccounts = await prisma.socialAccount.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      include: {
        users: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      recentVerifications: recentVerifications.map(v => ({
        id: v.id,
        platform: v.platform,
        code: v.code,
        verified: v.verified,
        verifiedAt: v.verifiedAt,
        createdAt: v.createdAt,
        userEmail: v.users.email
      })),
      recentSocialAccounts: recentSocialAccounts.map(a => ({
        id: a.id,
        platform: a.platform,
        username: a.username,
        verified: a.verified,
        verifiedAt: a.verifiedAt,
        createdAt: a.createdAt,
        userEmail: a.user.email
      })),
      summary: {
        verificationCount: recentVerifications.length,
        socialAccountCount: recentSocialAccounts.length,
        successfulVerifications: recentVerifications.filter(v => v.verified).length
      }
    })

  } catch (error) {
    console.error('Debug recent verifications error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Debug failed",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
