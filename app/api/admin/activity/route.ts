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

    // Get recent activities from various sources - wrap each in try/catch for resilience
    let recentUsers: any[] = []
    let recentSubmissions: any[] = []
    let recentPayouts: any[] = []
    let recentViewTracking: any[] = []

    try {
      recentUsers = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          role: true
        }
      })
    } catch (e) {
      console.error("Error fetching recent users:", e)
    }

    try {
      recentSubmissions = await prisma.clipSubmission.findMany({
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
      })
    } catch (e) {
      console.error("Error fetching recent submissions:", e)
    }

    try {
      recentPayouts = await prisma.payout.findMany({
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
      })
    } catch (e) {
      console.error("Error fetching recent payouts:", e)
    }

    try {
      // Get recent view tracking records with their clips
      const rawViewTracking = await prisma.viewTracking.findMany({
        orderBy: { scrapedAt: 'desc' },
        take: 30, // Fetch more to find previous records for increment calculation
        select: {
          id: true,
          clipId: true,
          views: true,
          platform: true,
          scrapedAt: true,
          clips: {
            select: { 
              id: true,
              url: true,
              views: true,
              clipSubmissions: {
                take: 1,
                select: { 
                  id: true,
                  initialViews: true,
                  campaigns: {
                    select: { title: true }
                  }
                }
              }
            }
          },
          users: {
            select: { name: true, email: true }
          }
        }
      })
      
      // For each tracking record, find the previous one for the same clip to calculate increment
      // Group by clipId to find previous tracking
      const clipTrackingMap = new Map<string, typeof rawViewTracking>()
      rawViewTracking.forEach(tracking => {
        const existing = clipTrackingMap.get(tracking.clipId) || []
        existing.push(tracking)
        clipTrackingMap.set(tracking.clipId, existing)
      })
      
      // Add previousViews to each tracking record
      recentViewTracking = rawViewTracking.slice(0, 15).map(tracking => {
        const clipHistory = clipTrackingMap.get(tracking.clipId) || []
        // Find the previous tracking record (the one right after this one in the sorted list)
        const currentIndex = clipHistory.findIndex(t => t.id === tracking.id)
        const previousTracking = clipHistory[currentIndex + 1]
        const previousViews = previousTracking ? Number(previousTracking.views) : 0
        
        return {
          ...tracking,
          previousViews // Add previousViews for increment calculation
        }
      })
    } catch (e) {
      console.error("Error fetching recent view tracking:", e)
    }

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
            id: user.id,
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

    // Add view tracking (scrapes) - limit to avoid spam
    // Only show clips that actually gained views in this scrape (increment > 0)
    const uniqueViewTrackings = new Map()
    recentViewTracking.forEach(tracking => {
      // Dedupe by clip URL to avoid spam from multiple scrapes
      const key = tracking.clips?.url
      if (key && !uniqueViewTrackings.has(key)) {
        uniqueViewTrackings.set(key, tracking)
      }
    })
    
    Array.from(uniqueViewTrackings.values()).slice(0, 15).forEach((tracking: any) => {
      if (tracking.scrapedAt) {
        const currentViews = tracking.views ? Number(tracking.views) : 0
        // Use the actual increment from last scrape (not total growth since submission)
        const previousViews = tracking.previousViews || 0
        const viewIncrement = Math.max(0, currentViews - previousViews)
        
        // Only show if there was an actual increase in views
        if (viewIncrement <= 0) return
        
        // Create a short display URL (e.g., "instagram.com/reel/abc...")
        const fullUrl = tracking.clips?.url || ''
        let shortUrl = fullUrl
        try {
          const urlObj = new URL(fullUrl)
          const path = urlObj.pathname.length > 20 
            ? urlObj.pathname.substring(0, 20) + '...' 
            : urlObj.pathname
          shortUrl = urlObj.hostname.replace('www.', '') + path
        } catch {
          shortUrl = fullUrl.length > 40 ? fullUrl.substring(0, 40) + '...' : fullUrl
        }
        
        const submission = tracking.clips?.clipSubmissions?.[0]
        
        activities.push({
          type: 'VIEW_SCRAPE',
          timestamp: tracking.scrapedAt,
          data: {
            views: currentViews,
            viewGrowth: viewIncrement, // Now shows actual increment, not total growth
            platform: tracking.platform,
            url: tracking.clips?.url,
            shortUrl: shortUrl,
            clipId: tracking.clipId,
            submissionId: submission?.id,
            campaignTitle: submission?.campaigns?.title,
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

