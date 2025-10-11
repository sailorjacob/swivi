import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Admin submissions API called")
    
    const { user, error } = await getServerUserWithRole(request)
    console.log("🔍 Auth result:", { userId: user?.id, error })

    if (!user?.id || error) {
      console.log("❌ Authentication failed")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    console.log("🔍 Looking up user in database:", user.id)
    const userData = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id }
    })
    console.log("🔍 User data found:", { id: userData?.id, role: userData?.role })

    if (!userData) {
      console.log("❌ User not found in database")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (userData.role !== "ADMIN") {
      console.log("❌ User is not admin, role:", userData.role)
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    console.log("✅ Admin access confirmed")

    // Use the same approach as clipper API that works
    console.log("🔍 Fetching submissions using clipper API approach...")
    
    const submissions = await prisma.clipSubmission.findMany({
      orderBy: {
        createdAt: "desc"
      },
      select: {
        id: true,
        clipUrl: true,
        platform: true,
        status: true,
        payout: true,
        paidAt: true,
        createdAt: true,
        rejectionReason: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        campaigns: {
          select: {
            id: true,
            title: true,
            creator: true,
            payoutRate: true
          }
        }
      },
      take: 50
    })

    console.log("✅ Found submissions:", submissions.length)

    const total = submissions.length

    return NextResponse.json({
      submissions: submissions,
      pagination: {
        total,
        limit: 50,
        offset: 0,
        hasMore: false
      }
    })
  } catch (error) {
    console.error("Error fetching submissions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
