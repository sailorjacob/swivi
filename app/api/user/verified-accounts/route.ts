import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../lib/auth"
import { prisma } from "../../../../lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Get verified social accounts for the user
    const verifiedAccounts = await prisma.socialAccount.findMany({
      where: {
        userId: session.user.id,
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
