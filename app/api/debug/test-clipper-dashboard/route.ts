// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  console.log("🧪 DEBUG: Test clipper dashboard API called")
  
  try {
    // Step 1: Test authentication
    console.log("🧪 Step 1: Testing authentication...")
    let authResult
    try {
      authResult = await getServerUserWithRole(request)
      console.log("🧪 Auth result:", { 
        hasUser: !!authResult.user, 
        userId: authResult.user?.id, 
        error: authResult.error 
      })
    } catch (authError) {
      console.error("🧪 ❌ Authentication failed:", authError)
      return NextResponse.json({ 
        step: "authentication", 
        error: authError.message,
        success: false 
      })
    }

    const { user, error } = authResult
    if (!user?.id || error) {
      return NextResponse.json({ 
        step: "authentication", 
        error: "No user or auth error",
        success: false 
      })
    }

    // Step 2: Test database user lookup
    console.log("🧪 Step 2: Testing user lookup...")
    let userData
    try {
      userData = await prisma.user.findUnique({
        where: { supabaseAuthId: user.id },
        select: {
          id: true,
          totalViews: true,
          totalEarnings: true
        }
      })
      console.log("🧪 User data:", { 
        found: !!userData, 
        id: userData?.id
      })
    } catch (dbError) {
      console.error("🧪 ❌ User lookup failed:", dbError)
      return NextResponse.json({ 
        step: "user_lookup", 
        error: dbError.message,
        success: false 
      })
    }

    // Step 3: Test campaign count
    console.log("🧪 Step 3: Testing campaign count...")
    let campaignCount
    try {
      campaignCount = await prisma.campaign.count({
        where: { status: "ACTIVE" }
      })
      console.log("🧪 Active campaigns:", campaignCount)
    } catch (dbError) {
      console.error("🧪 ❌ Campaign count failed:", dbError)
      return NextResponse.json({ 
        step: "campaign_count", 
        error: dbError.message,
        success: false 
      })
    }

    // Step 4: Test simple submission fetch for user
    console.log("🧪 Step 4: Testing user submissions...")
    let userSubmissions
    try {
      if (userData) {
        userSubmissions = await prisma.clipSubmission.findMany({
          where: { userId: userData.id },
          take: 5,
          select: {
            id: true,
            clipUrl: true,
            status: true,
            createdAt: true
          }
        })
        console.log("🧪 User submissions:", userSubmissions.length)
      } else {
        userSubmissions = []
        console.log("🧪 No user data, skipping submissions")
      }
    } catch (dbError) {
      console.error("🧪 ❌ User submissions failed:", dbError)
      return NextResponse.json({ 
        step: "user_submissions", 
        error: dbError.message,
        success: false 
      })
    }

    // Step 5: Test submission with relations
    console.log("🧪 Step 5: Testing submissions with relations...")
    let submissionsWithRelations
    try {
      if (userData) {
        submissionsWithRelations = await prisma.clipSubmission.findMany({
          where: { userId: userData.id },
          take: 2,
          select: {
            id: true,
            clipUrl: true,
            campaigns: {
              select: {
                title: true,
                creator: true
              }
            },
            clips: {
              select: {
                id: true,
                title: true
              }
            }
          }
        })
        console.log("🧪 Submissions with relations:", submissionsWithRelations.length)
      } else {
        submissionsWithRelations = []
        console.log("🧪 No user data, skipping relations test")
      }
    } catch (dbError) {
      console.error("🧪 ❌ Submissions with relations failed:", dbError)
      return NextResponse.json({ 
        step: "submissions_with_relations", 
        error: dbError.message,
        success: false 
      })
    }

    return NextResponse.json({
      success: true,
      results: {
        authentication: "✅ Passed",
        user_lookup: userData ? "✅ User found" : "⚠️ User not found (will be created)", 
        campaign_count: `✅ ${campaignCount} active campaigns`,
        user_submissions: `✅ ${userSubmissions.length} user submissions`,
        submissions_with_relations: `✅ ${submissionsWithRelations.length} with relations`
      },
      userData: userData ? {
        id: userData.id,
        totalViews: userData.totalViews.toString(),
        totalEarnings: userData.totalEarnings.toString()
      } : null
    })

  } catch (error) {
    console.error("🧪 ❌ Unexpected error:", error)
    return NextResponse.json({ 
      step: "unexpected", 
      error: error.message,
      success: false 
    })
  }
}
