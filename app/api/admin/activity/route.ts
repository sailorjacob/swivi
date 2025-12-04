// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole(request)
    
    if (!user || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get recent activities from various sources
    const [
      recentUsers,
      recentSubmissions,
      recentPayouts,
      recentViewTracking
    ] = await Promise.all([
      // Recent user signups (last 20)
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          role: true
        }
      }),
      
      // Recent clip submissions (last 20)
      prisma.clipSubmission.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          users: {
            select: { name: true, email: true }
          },
          campaigns: {
            select: { title: true }
          },
          clips: {
            select: { url: true, platform: true }
          }
        }
      }),
      
      // Recent payout requests (last 20)
      prisma.payout.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          amount: true,
          status: true,
          paymentMethod: true,
          createdAt: true,
          processedAt: true,
          users: {
            select: { name: true, email: true }
          }
        }
      }),
      
      // Recent view tracking updates (last 20)
      prisma.viewTracking.findMany({
        orderBy: { scrapedAt: 'desc' },
        take: 20,
        select: {
          id: true,
          views: true,
          platform: true,
          scrapedAt: true,
          createdAt: true,
          clips: {
            select: { url: true }
          },
          users: {
            select: { name: true, email: true }
          }
        }
      })
    ])

    // Combine and sort all activities by date
    const activities: Array<{
      type: string
      timestamp: Date
      data: any
    }> = []

    // Add user signups
    recentUsers.forEach(user => {
      if (user.createdAt) {
        activities.push({
          type: 'USER_SIGNUP',
          timestamp: user.createdAt,
          data: {
            name: user.name,
            email: user.email,
            role: user.role
          }
        })
      }
    })

    // Add submissions
    recentSubmissions.forEach(submission => {
      if (submission.createdAt) {
        activities.push({
          type: 'SUBMISSION',
          timestamp: submission.createdAt,
          data: {
            id: submission.id,
            status: submission.status,
            userName: submission.users?.name || submission.users?.email?.split('@')[0],
            campaignTitle: submission.campaigns?.title,
            platform: submission.clips?.platform,
            url: submission.clips?.url
          }
        })
      }
      
      // Also add status changes if updated differently from created
      if (submission.updatedAt && submission.createdAt && 
          submission.updatedAt.getTime() !== submission.createdAt.getTime() &&
          submission.status !== 'PENDING') {
        activities.push({
          type: 'SUBMISSION_UPDATE',
          timestamp: submission.updatedAt,
          data: {
            id: submission.id,
            status: submission.status,
            userName: submission.users?.name || submission.users?.email?.split('@')[0],
            campaignTitle: submission.campaigns?.title
          }
        })
      }
    })

    // Add payout requests
    recentPayouts.forEach(payout => {
      if (payout.createdAt) {
        activities.push({
          type: 'PAYOUT_REQUEST',
          timestamp: payout.createdAt,
          data: {
            id: payout.id,
            amount: Number(payout.amount),
            status: payout.status,
            method: payout.paymentMethod,
            userName: payout.users?.name || payout.users?.email?.split('@')[0]
          }
        })
      }
      
      // Add payout completions
      if (payout.processedAt && payout.status === 'COMPLETED') {
        activities.push({
          type: 'PAYOUT_COMPLETED',
          timestamp: payout.processedAt,
          data: {
            id: payout.id,
            amount: Number(payout.amount),
            method: payout.paymentMethod,
            userName: payout.users?.name || payout.users?.email?.split('@')[0]
          }
        })
      }
    })

    // Add view tracking (scrapes)
    recentViewTracking.forEach(tracking => {
      if (tracking.scrapedAt) {
        activities.push({
          type: 'VIEW_SCRAPE',
          timestamp: tracking.scrapedAt,
          data: {
            views: Number(tracking.views),
            platform: tracking.platform,
            url: tracking.clips?.url,
            userName: tracking.users?.name || tracking.users?.email?.split('@')[0]
          }
        })
      }
    })

    // Sort by timestamp descending and take top 50
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    const recentActivities = activities.slice(0, 50)

    // Convert timestamps to ISO strings for JSON
    const serializedActivities = recentActivities.map(activity => ({
      ...activity,
      timestamp: activity.timestamp.toISOString()
    }))

    return NextResponse.json({ activities: serializedActivities })
  } catch (error) {
    console.error("Error fetching admin activity:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

