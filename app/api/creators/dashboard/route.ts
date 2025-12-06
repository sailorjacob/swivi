// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { convertBigIntToString } from "@/lib/bigint-utils"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Clipper dashboard API called")

    let authResult
    try {
      authResult = await getServerUserWithRole(request)
    } catch (authError) {
      console.error("❌ Dashboard authentication error:", authError)
      return NextResponse.json({ error: "Authentication service unavailable" }, { status: 503 })
    }

    const { user, error } = authResult

    if (!user || error) {
      console.log('❌ Dashboard auth failed:', {
        hasUser: !!user,
        userId: user?.id,
        error: error?.message,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('✅ Dashboard auth success for user:', user.id)
    
    const userId = user.id

    // Get user's real stats
    let userData
    try {
      userData = await prisma.user.findUnique({
        where: { supabaseAuthId: userId },
        select: {
          id: true,
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
              initialViews: true,
              campaigns: {
                select: {
                  id: true,
                  title: true,
                  creator: true,
                  status: true,
                  featuredImage: true
                }
              },
              clips: {
                select: {
                  id: true,
                  title: true,
                  earnings: true,
                  views: true,
                  status: true,
                  view_tracking: {
                    orderBy: { scrapedAt: "desc" },
                    select: {
                      id: true,
                      views: true,
                      date: true,
                      scrapedAt: true
                    }
                  }
                }
              }
            },
            orderBy: { createdAt: "desc" }
          }
        }
      })
      console.log("🔍 User data lookup result:", { found: !!userData, userId })
    } catch (dbError) {
      console.error("❌ Database error looking up user:", dbError)
      // Return empty dashboard instead of error
      return NextResponse.json({
        stats: [
          {
            title: "Total Earned",
            value: "$0.00",
            change: "Start earning from approved clips",
            changeType: "neutral",
            icon: "DollarSign",
            color: "text-foreground"
          },
          {
            title: "Active Campaigns",
            value: "0",
            change: "Available to join",
            changeType: "neutral",
            icon: "Target",
            color: "text-muted-foreground"
          },
          {
            title: "Clips Submitted",
            value: "0",
            change: "Submit your first clip",
            changeType: "neutral",
            icon: "Play",
            color: "text-muted-foreground"
          },
          {
            title: "Total Views",
            value: "0",
            change: "Grow your audience",
            changeType: "neutral",
            icon: "Eye",
            color: "text-muted-foreground"
          }
        ],
        recentClips: [],
        activeCampaigns: 0
      })
    }

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
                campaigns: {
                  select: {
                    title: true,
                    creator: true
                  }
                },
                clips: {
                  select: {
                    id: true,
                    title: true,
                    views: true,  // MAX ever tracked views
                    view_tracking: {
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
    let activeCampaigns = 0
    try {
      activeCampaigns = await prisma.campaign.count({
        where: { status: "ACTIVE" }
      })
      console.log("🔍 Active campaigns count:", activeCampaigns)
    } catch (dbError) {
      console.error("❌ Database error counting campaigns:", dbError)
      activeCampaigns = 0
    }

    // Calculate real stats
    const totalSubmissions = userData.clipSubmissions.length
    const approvedSubmissions = userData.clipSubmissions.filter(s => s.status === "APPROVED" || s.status === "PAID").length
    const pendingSubmissions = userData.clipSubmissions.filter(s => s.status === "PENDING").length

    // user.totalEarnings = current balance (after payouts deducted)
    const userCurrentBalance = Number(userData.totalEarnings || 0)

    // Calculate clip-level earnings (may be 0 if reset)
    const clipEarningsTotal = userData.clipSubmissions
      .filter(s => s.status === 'APPROVED')
      .reduce((sum, submission) => {
        return sum + Number(submission.clips?.earnings || 0)
      }, 0)

    // Get total amount already paid out to calculate lifetime earnings
    let totalPaidOut = 0
    try {
      const completedPayouts = await prisma.payout.aggregate({
        where: {
          userId: userData.id,
          status: 'COMPLETED'
        },
        _sum: { amount: true }
      })
      totalPaidOut = Number(completedPayouts._sum.amount || 0)
    } catch (e) {
      console.error('Error fetching payouts:', e)
    }

    // Total Earned (Lifetime) = Current Balance + Already Paid Out
    // This never decreases - it's your all-time earnings
    const totalEarned = userCurrentBalance + totalPaidOut

    // Use clip.views (MAX ever tracked) as single source of truth
    const totalViews = userData.clipSubmissions
      .filter(s => s.status === 'APPROVED' && s.clips)
      .reduce((sum, submission) => {
        return sum + Number(submission.clips?.views || 0)
      }, 0)

    // Tracked views: Views gained = total views (since initialViews is now 0)
    const trackedViews = userData.clipSubmissions
      .filter(s => s.status === 'APPROVED')
      .reduce((sum, submission) => {
        const currentViews = Number(submission.clips?.views || 0)
        const initialViews = submission.initialViews ? Number(submission.initialViews) : 0
        const viewsGained = Math.max(0, currentViews - initialViews)
        return sum + viewsGained
      }, 0)

    // Available balance: Current balance that can be requested for payout
    // This is totalEarnings minus any payouts already processed
    const availableBalance = userCurrentBalance

    // Active campaign earnings: Preview of what will be available when campaigns complete
    const activeCampaignEarnings = userData.clipSubmissions
      .filter(s => s.status === 'APPROVED' && s.campaigns.status === 'ACTIVE')
      .reduce((sum, submission) => {
        return sum + Number(submission.clips?.earnings || 0)
      }, 0)

    // Get recent clips with detailed view tracking including full scrape history
    const recentClips = userData.clipSubmissions.map(submission => {
      const clip = submission.clips
      const viewTrackingRecords = clip?.view_tracking || []
      const latestTracking = viewTrackingRecords[0]
      const initialViews = submission.initialViews ? Number(submission.initialViews) : 0

      // Calculate current views and view change since submission
      const currentViews = clip?.views ? Number(clip.views) : (latestTracking ? Number(latestTracking.views) : initialViews)
      const viewChange = currentViews - initialViews

      // Get earnings from clip (not submission.payout which is deprecated)
      // Only show earnings if submission is approved
      const earnings = submission.status === 'APPROVED' && clip?.earnings ? Number(clip.earnings) : 0

      // Build scrape history for display
      const scrapeHistory = viewTrackingRecords.slice(0, 20).map((track: any) => ({
        views: Number(track.views),
        date: track.date,
        scrapedAt: track.scrapedAt,
        success: Number(track.views) > 0
      }))

      return {
        id: submission.id,
        clipId: clip?.id || null,
        title: clip?.title || submission.clipUrl,
        campaign: submission.campaigns?.title || "Unknown Campaign",
        campaignId: submission.campaigns?.id || null,
        campaignImage: submission.campaigns?.featuredImage || null,
        campaignStatus: submission.campaigns?.status || null,
        status: submission.status?.toLowerCase() || "unknown",
        clipStatus: clip?.status || null,
        createdAt: submission.createdAt ? submission.createdAt.toISOString() : new Date().toISOString(),
        views: currentViews,
        initialViews: initialViews.toString(),
        currentViews: currentViews.toString(),
        viewChange: viewChange.toString(),
        earnings: earnings,
        clipUrl: submission.clipUrl,
        platform: submission.platform,
        lastTracked: latestTracking?.scrapedAt ? new Date(latestTracking.scrapedAt).toISOString() : null,
        scrapeCount: viewTrackingRecords.length,
        scrapeHistory: scrapeHistory
      }
    })

    const stats = [
      {
        title: "Total Earned",
        value: `$${totalEarned.toFixed(2)}`,
        change: activeCampaignEarnings > 0 
          ? `$${activeCampaignEarnings.toFixed(2)} in active campaigns` 
          : approvedSubmissions > 0 
            ? `${approvedSubmissions} approved clips` 
            : "Start earning from approved clips",
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
        value: totalViews.toLocaleString(),
        change: "Includes initial views",
        changeType: "neutral" as const,
        icon: "Eye",
        color: "text-muted-foreground"
      },
      {
        title: "Tracked Views",
        value: trackedViews.toLocaleString(),
        change: "Views from scrapes",
        changeType: trackedViews > 0 ? "positive" : "neutral" as const,
        icon: "Eye",
        color: "text-blue-600 dark:text-blue-400"
      }
    ]

    return NextResponse.json({
      stats: convertBigIntToString(stats),
      recentClips: convertBigIntToString(recentClips),
      activeCampaigns: activeCampaigns,
      availableBalance: availableBalance,
      activeCampaignEarnings: activeCampaignEarnings,
      totalEarnings: totalEarned,
      totalViews: totalViews,
      trackedViews: trackedViews
    })

  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    
    // If it's a database connection issue, return empty state instead of error
    if (error.message?.includes('prepared statement') || 
        error.message?.includes('database') || 
        error.message?.includes('connection')) {
      console.log('🔍 Database connection issue - returning empty state for new user')
      
      return NextResponse.json({
        stats: [
          {
            title: "Total Earned",
            value: "$0.00",
            change: "Start earning from approved clips",
            changeType: "neutral",
            icon: "DollarSign",
            color: "text-foreground"
          },
          {
            title: "Active Campaigns",
            value: "0",
            change: "Available to join",
            changeType: "neutral",
            icon: "Target",
            color: "text-muted-foreground"
          },
          {
            title: "Clips Submitted",
            value: "0",
            change: "Submit your first clip",
            changeType: "neutral",
            icon: "Play",
            color: "text-muted-foreground"
          },
          {
            title: "Total Views",
            value: "0",
            change: "Grow your audience",
            changeType: "neutral",
            icon: "Eye",
            color: "text-muted-foreground"
          }
        ],
        recentClips: [],
        activeCampaigns: 0
      })
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
