import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole()

    if (!user?.id || error) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Find the User record by supabaseAuthId to get the internal ID
    const userRecord = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id }
    })

    if (!userRecord) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Get verified social accounts for the user
    const verifiedAccounts = await prisma.socialAccount.findMany({
      where: {
        userId: userRecord.id,
        verified: true
      },
      orderBy: {
        verifiedAt: 'desc'
      }
    })

    return NextResponse.json(verifiedAccounts)

  } catch (error) {
    console.error("Error fetching verified accounts:", error)
    return NextResponse.json(
      { error: "Internal server error" },
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

    // Find the User record by supabaseAuthId to get the internal ID
    const userRecord = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id }
    })

    if (!userRecord) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Check if the account belongs to the user
    const account = await prisma.socialAccount.findFirst({
      where: {
        id: accountId,
        userId: userRecord.id
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
        userId: userRecord.id,
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
