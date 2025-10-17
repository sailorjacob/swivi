import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { convertBigIntToString } from "@/lib/bigint-utils"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Dashboard debug test started")

    // Test authentication
    const { user, error: authError } = await getServerUserWithRole(request)
    if (!user?.id || authError) {
      return NextResponse.json({ 
        success: false, 
        error: "Authentication failed",
        details: authError 
      })
    }

    console.log("✅ Auth successful, user ID:", user.id)

    // Test user lookup
    const userData = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        totalEarnings: true,
        totalViews: true,
        clipSubmissions: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            campaigns: {
              select: { title: true }
            },
            clips: {
              include: {
                view_tracking: {
                  take: 2,
                  orderBy: { date: "desc" }
                }
              }
            }
          }
        }
      }
    })

    if (!userData) {
      return NextResponse.json({ 
        success: false, 
        error: "User not found in database" 
      })
    }

    console.log("✅ User found:", userData.email)
    console.log("📊 Raw totalEarnings:", userData.totalEarnings, typeof userData.totalEarnings)
    console.log("📊 Raw totalViews:", userData.totalViews, typeof userData.totalViews)

    // Test stats generation
    const totalSubmissions = userData.clipSubmissions.length
    const approvedSubmissions = userData.clipSubmissions.filter(s => s.status === "APPROVED" || s.status === "PAID").length
    const pendingSubmissions = userData.clipSubmissions.filter(s => s.status === "PENDING").length

    // Test earnings conversion
    let earningsValue
    try {
      earningsValue = parseFloat(userData.totalEarnings?.toString() || '0').toFixed(2)
      console.log("✅ Earnings conversion successful:", earningsValue)
    } catch (error) {
      console.error("❌ Earnings conversion failed:", error)
      earningsValue = "0.00"
    }

    // Test views conversion
    let viewsValue
    try {
      viewsValue = Number(userData.totalViews?.toString() || '0').toLocaleString()
      console.log("✅ Views conversion successful:", viewsValue)
    } catch (error) {
      console.error("❌ Views conversion failed:", error)
      viewsValue = "0"
    }

    const stats = [
      {
        title: "Total Earned",
        value: `$${earningsValue}`,
        change: approvedSubmissions > 0 ? `${approvedSubmissions} approved clips` : "Start earning from approved clips",
        changeType: approvedSubmissions > 0 ? "positive" : "neutral" as const,
        icon: "DollarSign",
        color: "text-foreground"
      },
      {
        title: "Active Campaigns",
        value: "0", // Simplified for test
        change: "Available to join",
        changeType: "neutral" as const,
        icon: "Target",
        color: "text-muted-foreground"
      },
      {
        title: "Clips Submitted",
        value: totalSubmissions.toString(),
        change: pendingSubmissions > 0 ? `${pendingSubmissions} pending approval` : "Submit your first clip",
        changeType: pendingSubmissions > 0 ? "neutral" : "neutral" as const,
        icon: "Play",
        color: "text-muted-foreground"
      },
      {
        title: "Total Views",
        value: viewsValue,
        change: "Grow your audience",
        changeType: "neutral" as const,
        icon: "Eye",
        color: "text-muted-foreground"
      }
    ]

    // Test recent clips
    const recentClips = userData.clipSubmissions.map(submission => {
      const clip = submission.clips
      const latestTracking = clip?.view_tracking?.[0]
      const previousTracking = clip?.view_tracking?.[1]

      let currentViews = 0
      let previousViews = 0
      let viewGrowth = 0

      try {
        currentViews = latestTracking ? Number(latestTracking.views) : 0
        previousViews = previousTracking ? Number(previousTracking.views) : 0
        viewGrowth = currentViews - previousViews
      } catch (error) {
        console.error("❌ View calculation error:", error)
      }

      let earnings = 0
      try {
        earnings = submission.status === "PAID" ? parseFloat(String(submission.payout || 0)) : 0
      } catch (error) {
        console.error("❌ Earnings calculation error:", error)
      }

      return {
        id: submission.id,
        title: clip?.title || submission.clipUrl,
        campaign: submission.campaigns?.title || "Unknown Campaign",
        status: submission.status?.toLowerCase() || "unknown",
        submittedAt: submission.createdAt ? submission.createdAt.toISOString().split('T')[0] : "Unknown",
        views: currentViews,
        viewGrowth: viewGrowth,
        earnings: earnings,
        clipUrl: submission.clipUrl,
        platform: submission.platform,
        lastTracked: latestTracking?.date ? latestTracking.date.toISOString().split('T')[0] : null
      }
    })

    const response = {
      stats: convertBigIntToString(stats),
      recentClips: convertBigIntToString(recentClips),
      activeCampaigns: 0
    }

    console.log("✅ Dashboard debug test completed successfully")

    return NextResponse.json({
      success: true,
      userData: {
        id: userData.id,
        email: userData.email,
        totalEarnings: userData.totalEarnings?.toString(),
        totalViews: userData.totalViews?.toString(),
        submissionsCount: totalSubmissions
      },
      response: response
    })

  } catch (error) {
    console.error("❌ Dashboard debug test failed:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}
