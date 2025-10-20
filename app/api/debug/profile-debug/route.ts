// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { serializeUser } from "@/lib/bigint-utils"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Profile Debug: Starting...")
    
    const result: any = {
      timestamp: new Date().toISOString(),
      step: "starting",
      debug_info: {}
    }

    // Step 1: Check session
    try {
      console.log("🔍 Profile Debug: Getting session...")
      result.step = "getting_session"
      
      const { user, error } = await getServerUserWithRole()
      result.debug_info.session_check = {
        exists: !!user,
        user_id: user?.id || null,
        user_email: user?.email || null,
        user_name: user?.user_metadata?.full_name || null,
        role: user?.role || null
      }

      if (!user) {
        result.error = "No user found"
        result.step = "user_missing"
        return NextResponse.json(result, { status: 401 })
      }

      if (!user?.id) {
        result.error = "User exists but no user ID"
        result.step = "invalid_session"
        return NextResponse.json(result, { status: 401 })
      }

      console.log("✅ Profile Debug: User valid for user", user.id)
      result.step = "session_valid"

      // Step 2: Test database query
      try {
        console.log("🔍 Profile Debug: Querying database...")
        result.step = "querying_database"
        
        const userRaw = await prisma.user.findUnique({
          where: { supabaseAuthId: user.id },
          select: {
            id: true,
            name: true,
            email: true,
            bio: true,
            website: true,
            walletAddress: true,
            paypalEmail: true,
            image: true,
            verified: true,
            totalEarnings: true,
            totalViews: true,
            createdAt: true,
            socialAccounts: {
              select: {
                platform: true,
                username: true,
                verified: true,
              }
            }
          }
        })

        if (!userRaw) {
          result.error = "User not found in database"
          result.step = "user_not_found"
          return NextResponse.json(result, { status: 404 })
        }

        // Convert BigInt fields to strings for JSON serialization
        const user = serializeUser(userRaw)

        result.debug_info.database_query = {
          user_found: true,
          user_id: user.id,
          accounts_count: user.accounts?.length || 0
        }

        console.log("✅ Profile Debug: User found in database")
        result.step = "success"
        result.debug_info.user_data = user

        return NextResponse.json({
          ...result,
          message: "Profile debug successful",
          profile_data: user
        })

      } catch (dbError) {
        console.error("❌ Profile Debug: Database error:", dbError)
        result.error = "Database query failed"
        result.step = "database_error"
        result.debug_info.database_error = {
          message: dbError instanceof Error ? dbError.message : String(dbError),
          name: dbError instanceof Error ? dbError.name : "Unknown"
        }
        return NextResponse.json(result, { status: 500 })
      }

    } catch (sessionError) {
      console.error("❌ Profile Debug: Session error:", sessionError)
      result.error = "Session check failed"
      result.step = "session_error"
      result.debug_info.session_error = {
        message: sessionError instanceof Error ? sessionError.message : String(sessionError),
        name: sessionError instanceof Error ? sessionError.name : "Unknown"
      }
      return NextResponse.json(result, { status: 500 })
    }

  } catch (error) {
    console.error("❌ Profile Debug: General error:", error)
    return NextResponse.json({
      error: "Profile debug failed",
      step: "general_error",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
