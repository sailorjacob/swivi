import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole(request, '/api/clippers/dashboard')

    if (!user || error) {
      console.log('❌ Dashboard auth failed:', { user: !!user, error: error?.message })
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = user.id

    // Get user's real stats
    let userData = await prisma.user.findUnique({
      where: { supabaseAuthId: userId },
      select: {
        totalViews: true,
        totalEarnings: true,
        clipSubmissions: {
          select: {
            id: true,
            status: true,
            payout: true,
            clipUrl: true,
            platform: true,
            createdAt: true,
            campaign: {
              select: {
                title: true,
                creator: true
              }
            },
            clip: {
              select: {
                id: true,
                title: true,
                viewTracking: {
                  orderBy: { date: "desc" },
                  take: 1
                }
              }
            }
          },
          orderBy: { createdAt: "desc" },
          take: 10
        }
      }
    })

    // If user doesn't exist in database, create them
    if (!userData) {
      console.log("⚠️ User not found in database, creating...")

      try {
        const newUserData = {
          supabaseAuthId: userId,
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'New User',
          image: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
          verified: user.email_confirmed_at ? true : false,
          role: 'CLIPPER'
        }

        const createdUser = await prisma.user.create({
          data: newUserData
        })

        console.log("✅ User created successfully")

        // Fetch the newly created user data
        userData = await prisma.user.findUnique({
          where: { supabaseAuthId: userId },
          select: {
            totalViews: true,
            totalEarnings: true,
            clipSubmissions: {
              select: {
                id: true,
                status: true,
                payout: true,
                clipUrl: true,
                platform: true,
                createdAt: true,
                campaign: {
                  select: {
                    title: true,
                    creator: true
                  }
                },
                clip: {
                  select: {
                    id: true,
                    title: true,
                    viewTracking: {
                      orderBy: { date: "desc" },
                      take: 1
                    }
                  }
                }
              },
              orderBy: { createdAt: "desc" },
              take: 10
            }
          }
        })

        if (!userData) {
          // Fallback if fetch fails
          userData = {
            totalViews: 0,
            totalEarnings: 0,
            clipSubmissions: []
          }
        }
      } catch (createError) {
        console.error("❌ Failed to create user:", createError)
        // Return empty stats if creation fails
        userData = {
          totalViews: 0,
          totalEarnings: 0,
          clipSubmissions: []
        }
      }
    }

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get active campaigns count
    const activeCampaigns = await prisma.campaign.count({
      where: { status: "ACTIVE" }
    })

    // Calculate real stats
    const totalSubmissions = userData.clipSubmissions.length
    const approvedSubmissions = userData.clipSubmissions.filter(s => s.status === "APPROVED" || s.status === "PAID").length
    const pendingSubmissions = userData.clipSubmissions.filter(s => s.status === "PENDING").length

    // Get recent clips with proper data structure
    const recentClips = userData.clipSubmissions.map(submission => {
      const latestTracking = submission.clip?.viewTracking[0]
      return {
        id: submission.id,
        title: submission.clip?.title || submission.clipUrl,
        campaign: submission.campaign.title,
        status: submission.status.toLowerCase(),
        submittedAt: submission.createdAt.toISOString().split('T')[0],
        views: latestTracking ? Number(latestTracking.views) : 0,
        earnings: submission.status === "PAID" ? Number(submission.payout || 0) : 0,
        clipUrl: submission.clipUrl,
        platform: submission.platform
      }
    })

    const stats = [
      {
        title: "Total Earned",
        value: `$${Number(userData.totalEarnings).toFixed(2)}`,
        change: approvedSubmissions > 0 ? `${approvedSubmissions} approved clips` : "Start earning from approved clips",
        changeType: approvedSubmissions > 0 ? "positive" : "neutral" as const,
        icon: "DollarSign",
        color: "text-foreground"
      },
      {
        title: "Active Campaigns",
        value: activeCampaigns.toString(),
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
        value: Number(userData.totalViews).toLocaleString(),
        change: "Grow your audience",
        changeType: "neutral" as const,
        icon: "Eye",
        color: "text-muted-foreground"
      }
    ]

    return NextResponse.json({
      stats,
      recentClips,
      activeCampaigns: activeCampaigns
    })

  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
