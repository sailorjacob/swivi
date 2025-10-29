// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { convertBigIntToString } from "@/lib/bigint-utils"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Admin submissions API called")

    let authResult
    try {
      authResult = await getServerUserWithRole(request)
    } catch (authError) {
      console.error("❌ Authentication error:", authError)
      return NextResponse.json({ error: "Authentication service unavailable" }, { status: 503 })
    }

    const { user, error } = authResult
    console.log("🔍 Auth result:", { userId: user?.id, error })

    if (!user?.id || error) {
      console.log("❌ Authentication failed")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin - handle database errors gracefully
    console.log("🔍 Looking up user in database:", user.id)
    let userData
    try {
      userData = await prisma.user.findUnique({
        where: { supabaseAuthId: user.id }
      })
      console.log("🔍 User data found:", { id: userData?.id, role: userData?.role })
    } catch (dbError) {
      console.error("❌ Database error looking up user:", dbError)
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
    }

    if (!userData) {
      console.log("❌ User not found in database")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (userData.role !== "ADMIN") {
      console.log("❌ User is not admin, role:", userData.role)
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    console.log("✅ Admin access confirmed")

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")
    const status = searchParams.get("status")
    const platform = searchParams.get("platform")
    const campaignId = searchParams.get("campaignId")
    const dateRange = searchParams.get("dateRange")
    const payoutStatus = searchParams.get("payoutStatus")
    const requiresReview = searchParams.get("requiresReview")

    // Build where clause for filtering
    const where: any = {}

    if (status && status !== "all") {
      if (status === "flagged") {
        where.requiresReview = true
      } else {
        where.status = status
      }
    }

    if (platform && platform !== "all") {
      where.platform = platform
    }

    if (campaignId && campaignId !== "all") {
      where.campaignId = campaignId
    }

    if (dateRange && dateRange !== "all") {
      const now = new Date()
      switch (dateRange) {
        case "today":
          where.createdAt = {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
          }
          break
        case "week":
          where.createdAt = {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          }
          break
        case "month":
          where.createdAt = {
            gte: new Date(now.getFullYear(), now.getMonth(), 1)
          }
          break
      }
    }

    if (payoutStatus && payoutStatus !== "all") {
      if (payoutStatus === "paid") {
        where.payout = { not: null }
      } else if (payoutStatus === "unpaid") {
        where.payout = null
      }
    }

    console.log("🔍 Fetching submissions with filters:", where)

    let submissions
    try {
      // First, try a simpler query to isolate the issue
      console.log("🔍 Attempting simplified query first...")
      
      submissions = await prisma.clipSubmission.findMany({
        where,
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
          updatedAt: true,
          rejectionReason: true,
          requiresReview: true,
          reviewReason: true,
          clipId: true,
          initialViews: true,
          finalEarnings: true,
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              totalViews: true,
              totalEarnings: true
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
        take: limit,
        skip: offset
      })

      console.log("✅ Basic query successful, found submissions:", submissions.length)
      
      // Now try to add clips data separately for submissions that have clipId
      const submissionsWithClips = await Promise.all(
        submissions.map(async (submission: any) => {
          if (submission.clipId) {
            try {
              const clipData = await prisma.clip.findUnique({
                where: { id: submission.clipId },
                select: {
                  id: true,
                  title: true,
                  views: true,
                  earnings: true,
                  view_tracking: {
                    orderBy: { date: "desc" },
                    take: 2
                  }
                }
              })
              return { ...submission, clips: clipData }
            } catch (clipError) {
              console.error(`❌ Error fetching clip data for submission ${submission.id}:`, clipError)
              return { ...submission, clips: null }
            }
          } else {
            return { ...submission, clips: null }
          }
        })
      )
      
      // Update submissions with the enhanced data
      submissions = submissionsWithClips

      console.log("✅ Enhanced submissions with clip data:", submissions.length)
    } catch (dbError) {
      console.error("❌ Database error fetching submissions:", dbError)
      return NextResponse.json({
        submissions: [],
        pagination: {
          total: 0,
          limit: limit,
          offset: offset,
          hasMore: false
        }
      })
    }

    // Calculate pagination info - handle database errors
    let total
    try {
      total = await prisma.clipSubmission.count({ where })
      const hasMore = offset + limit < total

      // Convert dates to ISO strings and BigInt to strings
      console.log("🔍 Processing submissions for response, count:", submissions.length)
      
      const processedSubmissions = convertBigIntToString(submissions).map((submission: any) => {
        try {
          // Calculate view change
          const latestViews = submission.clips?.view_tracking?.[0]?.views || BigInt(0)
          const initialViews = submission.initialViews || BigInt(0)
          const viewChange = latestViews - initialViews
          
          return {
            ...submission,
            createdAt: submission.createdAt ? new Date(submission.createdAt).toISOString() : null,
            updatedAt: submission.updatedAt ? new Date(submission.updatedAt).toISOString() : null,
            paidAt: submission.paidAt ? new Date(submission.paidAt).toISOString() : null,
            initialViews: submission.initialViews ? submission.initialViews.toString() : "0",
            finalEarnings: submission.finalEarnings ? submission.finalEarnings.toString() : "0",
            currentViews: latestViews.toString(),
            viewChange: viewChange.toString(),
            // Ensure clips data is properly processed
            clips: submission.clips ? {
              ...submission.clips,
              views: submission.clips.views ? submission.clips.views.toString() : null,
              earnings: submission.clips.earnings ? submission.clips.earnings.toString() : null,
              view_tracking: submission.clips.view_tracking || []
            } : null
          }
        } catch (dateError) {
          console.error("❌ Error processing submission dates:", dateError, "Submission:", submission.id)
          return {
            ...submission,
            createdAt: null,
            updatedAt: null,
            paidAt: null,
            clips: null
          }
        }
      })
      
      console.log("✅ Processed submissions successfully")

      return NextResponse.json({
        submissions: processedSubmissions,
        pagination: {
          total,
          limit: limit,
          offset: offset,
          hasMore
        }
      })
    } catch (dbError) {
      console.error("❌ Database error counting submissions:", dbError)
      
      // Convert dates to ISO strings and BigInt to strings for error case too
      const processedSubmissions = convertBigIntToString(submissions).map((submission: any) => {
        try {
          // Calculate view change
          const latestViews = submission.clips?.view_tracking?.[0]?.views || BigInt(0)
          const initialViews = submission.initialViews || BigInt(0)
          const viewChange = latestViews - initialViews
          
          return {
            ...submission,
            createdAt: submission.createdAt ? new Date(submission.createdAt).toISOString() : null,
            updatedAt: submission.updatedAt ? new Date(submission.updatedAt).toISOString() : null,
            paidAt: submission.paidAt ? new Date(submission.paidAt).toISOString() : null,
            initialViews: submission.initialViews ? submission.initialViews.toString() : "0",
            finalEarnings: submission.finalEarnings ? submission.finalEarnings.toString() : "0",
            currentViews: latestViews.toString(),
            viewChange: viewChange.toString(),
            clips: submission.clips ? {
              ...submission.clips,
              views: submission.clips.views ? submission.clips.views.toString() : null,
              earnings: submission.clips.earnings ? submission.clips.earnings.toString() : null,
              view_tracking: submission.clips.view_tracking || []
            } : null
          }
        } catch (dateError) {
          console.error("❌ Error processing submission dates in error case:", dateError)
          return {
            ...submission,
            createdAt: null,
            updatedAt: null,
            paidAt: null,
            clips: null
          }
        }
      })

      return NextResponse.json({
        submissions: processedSubmissions,
        pagination: {
          total: 0,
          limit: limit,
          offset: offset,
          hasMore: false
        }
      })
    }
  } catch (error) {
    console.error("❌ CRITICAL ERROR in submissions API:", error)
    console.error("❌ Error stack:", error instanceof Error ? error.stack : 'No stack trace')
    console.error("❌ Error type:", typeof error)
    console.error("❌ Error string:", String(error))

    // Handle database connection errors gracefully
    if (String(error).includes('database') || String(error).includes('connection') || String(error).includes("Can't reach database server")) {
      console.log('🔧 Database unavailable - returning empty results instead of 500 error')
      return NextResponse.json({
        submissions: [],
        pagination: {
          total: 0,
          limit: 50,
          offset: 0,
          hasMore: false
        }
      })
    }

    return NextResponse.json({ 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}
