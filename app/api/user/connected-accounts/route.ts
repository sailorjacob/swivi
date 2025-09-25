import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Get user with their OAuth accounts
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        accounts: {
          select: {
            provider: true,
            providerAccountId: true,
          }
        },
        socialAccounts: {
          where: {
            verified: true
          },
          orderBy: {
            verifiedAt: 'desc'
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Format the response
    const connectedAccounts = []

    // Add OAuth accounts (Discord, Google)
    for (const account of user.accounts) {
      connectedAccounts.push({
        id: `oauth_${account.provider}_${account.providerAccountId}`,
        type: 'oauth',
        platform: account.provider.toUpperCase(),
        username: user.email || 'Connected',
        displayName: account.provider.charAt(0).toUpperCase() + account.provider.slice(1) + ' Account',
        isOAuth: true,
        canDelete: false, // OAuth accounts cannot be deleted from here
        verifiedAt: user.createdAt
      })
    }

    // Add verified social accounts
    for (const account of user.socialAccounts) {
      connectedAccounts.push({
        id: account.id,
        type: 'social',
        platform: account.platform,
        username: account.username,
        displayName: account.displayName || account.username,
        isOAuth: false,
        canDelete: true,
        verifiedAt: account.verifiedAt
      })
    }

    return NextResponse.json(connectedAccounts)

  } catch (error) {
    console.error("Error fetching connected accounts:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('id')

    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      )
    }

    // Prevent deletion of OAuth accounts
    if (accountId.startsWith('oauth_')) {
      return NextResponse.json(
        { error: "OAuth accounts cannot be deleted from here" },
        { status: 400 }
      )
    }

    // Check if the account belongs to the user
    const account = await prisma.socialAccount.findFirst({
      where: {
        id: accountId,
        userId: session.user.id
      }
    })

    if (!account) {
      return NextResponse.json(
        { error: "Account not found or doesn't belong to user" },
        { status: 404 }
      )
    }

    // Delete the account
    await prisma.socialAccount.delete({
      where: { id: accountId }
    })

    // Also delete any associated verification records
    await prisma.socialVerification.deleteMany({
      where: {
        userId: session.user.id,
        platform: account.platform
      }
    })

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting account:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
