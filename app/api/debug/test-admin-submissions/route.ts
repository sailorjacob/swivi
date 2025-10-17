import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  console.log("🧪 DEBUG: Test admin submissions API called")
  
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
        where: { supabaseAuthId: user.id }
      })
      console.log("🧪 User data:", { 
        found: !!userData, 
        id: userData?.id, 
        role: userData?.role 
      })
    } catch (dbError) {
      console.error("🧪 ❌ User lookup failed:", dbError)
      return NextResponse.json({ 
        step: "user_lookup", 
        error: dbError.message,
        success: false 
      })
    }

    if (!userData || userData.role !== "ADMIN") {
      return NextResponse.json({ 
        step: "authorization", 
        error: `Not admin. Role: ${userData?.role || 'none'}`,
        success: false 
      })
    }

    // Step 3: Test simple submission count
    console.log("🧪 Step 3: Testing submission count...")
    let count
    try {
      count = await prisma.clipSubmission.count()
      console.log("🧪 Total submissions:", count)
    } catch (dbError) {
      console.error("🧪 ❌ Count failed:", dbError)
      return NextResponse.json({ 
        step: "count", 
        error: dbError.message,
        success: false 
      })
    }

    // Step 4: Test simple submission fetch (no relations)
    console.log("🧪 Step 4: Testing simple submission fetch...")
    let simpleSubmissions
    try {
      simpleSubmissions = await prisma.clipSubmission.findMany({
        take: 5,
        select: {
          id: true,
          clipUrl: true,
          platform: true,
          status: true,
          createdAt: true
        }
      })
      console.log("🧪 Simple submissions:", simpleSubmissions.length)
    } catch (dbError) {
      console.error("🧪 ❌ Simple fetch failed:", dbError)
      return NextResponse.json({ 
        step: "simple_fetch", 
        error: dbError.message,
        success: false 
      })
    }

    // Step 5: Test with user relation only
    console.log("🧪 Step 5: Testing with user relation...")
    let userRelationSubmissions
    try {
      userRelationSubmissions = await prisma.clipSubmission.findMany({
        take: 2,
        select: {
          id: true,
          clipUrl: true,
          users: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })
      console.log("🧪 User relation submissions:", userRelationSubmissions.length)
    } catch (dbError) {
      console.error("🧪 ❌ User relation failed:", dbError)
      return NextResponse.json({ 
        step: "user_relation", 
        error: dbError.message,
        success: false 
      })
    }

    // Step 6: Test with clips relation
    console.log("🧪 Step 6: Testing with clips relation...")
    let clipsRelationSubmissions
    try {
      clipsRelationSubmissions = await prisma.clipSubmission.findMany({
        take: 2,
        select: {
          id: true,
          clipUrl: true,
          clips: {
            select: {
              id: true,
              title: true,
              views: true
            }
          }
        }
      })
      console.log("🧪 Clips relation submissions:", clipsRelationSubmissions.length)
    } catch (dbError) {
      console.error("🧪 ❌ Clips relation failed:", dbError)
      return NextResponse.json({ 
        step: "clips_relation", 
        error: dbError.message,
        success: false 
      })
    }

    // Step 7: Test with view_tracking nested relation
    console.log("🧪 Step 7: Testing with view_tracking nested relation...")
    let viewTrackingSubmissions
    try {
      viewTrackingSubmissions = await prisma.clipSubmission.findMany({
        take: 2,
        select: {
          id: true,
          clipUrl: true,
          clips: {
            select: {
              id: true,
              title: true,
              view_tracking: {
                orderBy: { date: "desc" },
                take: 2
              }
            }
          }
        }
      })
      console.log("🧪 View tracking submissions:", viewTrackingSubmissions.length)
    } catch (dbError) {
      console.error("🧪 ❌ View tracking relation failed:", dbError)
      return NextResponse.json({ 
        step: "view_tracking_relation", 
        error: dbError.message,
        success: false 
      })
    }

    return NextResponse.json({
      success: true,
      results: {
        authentication: "✅ Passed",
        user_lookup: "✅ Passed", 
        authorization: "✅ Admin confirmed",
        count: `✅ ${count} submissions found`,
        simple_fetch: `✅ ${simpleSubmissions.length} simple submissions`,
        user_relation: `✅ ${userRelationSubmissions.length} with user relation`,
        clips_relation: `✅ ${clipsRelationSubmissions.length} with clips relation`,
        view_tracking_relation: `✅ ${viewTrackingSubmissions.length} with view tracking`
      }
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
