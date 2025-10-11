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

    // Skip all filtering for now - just get basic submissions
    console.log("🔍 Fetching all submissions...")
    
    const submissions = await prisma.clipSubmission.findMany({
      select: {
        id: true,
        clipUrl: true,
        platform: true,
        status: true,
        createdAt: true,
        userId: true,
        campaignId: true
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 50
    })

    console.log("✅ Found submissions:", submissions.length)

    // Get related data separately to avoid relation issues
    const userIds = [...new Set(submissions.map(s => s.userId))]
    const campaignIds = [...new Set(submissions.map(s => s.campaignId))]

    console.log("🔍 Fetching users and campaigns...")
    
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true }
    })

    const campaigns = await prisma.campaign.findMany({
      where: { id: { in: campaignIds } },
      select: { id: true, title: true, creator: true }
    })

    console.log("✅ Found users:", users.length, "campaigns:", campaigns.length)

    // Combine the data
    const enrichedSubmissions = submissions.map(submission => ({
      ...submission,
      user: users.find(u => u.id === submission.userId),
      campaign: campaigns.find(c => c.id === submission.campaignId)
    }))

    const total = submissions.length

    return NextResponse.json({
      submissions: enrichedSubmissions,
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
