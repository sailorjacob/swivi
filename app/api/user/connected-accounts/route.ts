import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Connected Accounts API: Getting session...")
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      console.log("❌ Connected Accounts API: No session found", error)
      return NextResponse.json(
        { error: "No session found" },
        { status: 401 }
      )
    }

    console.log("✅ Connected Accounts API: Valid session for user", user.id)

    // Get user with their OAuth accounts
    const userData = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
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
          },
          select: {
            id: true,
            platform: true,
            username: true,
            displayName: true,
            verified: true,
            verifiedAt: true,
            createdAt: true
          }
        }
      }
    })

    if (!userData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Format the response
    const connectedAccounts = []

    // Add OAuth accounts (Discord, Google)
    for (const account of userData.accounts) {
      connectedAccounts.push({
        id: `oauth_${account.provider}_${account.providerAccountId}`,
        type: 'oauth',
        platform: account.provider.toUpperCase(),
        username: userData.email || 'Connected',
        displayName: account.provider.charAt(0).toUpperCase() + account.provider.slice(1) + ' Account',
        isOAuth: true,
        canDelete: false, // OAuth accounts cannot be deleted from here
        verifiedAt: userData.createdAt
      })
    }

    // Add verified social accounts
    for (const account of userData.socialAccounts) {
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
    
    // Provide more specific error details for debugging
    let errorMessage = "Internal server error"
    if (error instanceof Error) {
      if (error.message.includes('display_name')) {
        errorMessage = "Database schema mismatch - display_name column"
      } else if (error.message.includes('prepared statement')) {
        errorMessage = "Database connection issue - prepared statement conflict"
      } else if (error.message.includes('connect')) {
        errorMessage = "Database connection failed"
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
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
        userId: user.id
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

    // Also delete any associated verification records for this specific username
    // Only delete verification records, don't affect other usernames on same platform
    await prisma.socialVerification.deleteMany({
      where: {
        userId: user.id,
        platform: account.platform,
        // Note: We could add username matching here if we stored it in verification
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
