import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole()

    if (!user?.id || error) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get all social accounts for this user
    const socialAccounts = await prisma.socialAccount.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get all verification records for this user
    const verificationRecords = await prisma.socialVerification.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true
      }
    })

    return NextResponse.json({
      user,
      socialAccounts: socialAccounts.map(account => ({
        id: account.id,
        platform: account.platform,
        username: account.username,
        displayName: account.displayName,
        verified: account.verified,
        verifiedAt: account.verifiedAt,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt
      })),
      verificationRecords: verificationRecords.map(record => ({
        id: record.id,
        platform: record.platform,
        code: record.code,
        verified: record.verified,
        verifiedAt: record.verifiedAt,
        expiresAt: record.expiresAt,
        createdAt: record.createdAt
      })),
      counts: {
        totalSocialAccounts: socialAccounts.length,
        verifiedSocialAccounts: socialAccounts.filter(a => a.verified).length,
        totalVerificationRecords: verificationRecords.length,
        verifiedRecords: verificationRecords.filter(r => r.verified).length
      }
    })

  } catch (error) {
    console.error('Debug social accounts error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Debug failed",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
