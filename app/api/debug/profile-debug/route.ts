import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
      
      const session = await getServerSession(authOptions)
      result.debug_info.session_check = {
        exists: !!session,
        user_id: session?.user?.id || null,
        user_email: session?.user?.email || null,
        user_name: session?.user?.name || null
      }

      if (!session) {
        result.error = "No session found"
        result.step = "session_missing"
        return NextResponse.json(result, { status: 401 })
      }

      if (!session.user?.id) {
        result.error = "Session exists but no user ID"
        result.step = "invalid_session"
        return NextResponse.json(result, { status: 401 })
      }

      console.log("✅ Profile Debug: Session valid for user", session.user.id)
      result.step = "session_valid"

      // Step 2: Test database query
      try {
        console.log("🔍 Profile Debug: Querying database...")
        result.step = "querying_database"
        
        const userRaw = await prisma.user.findUnique({
          where: { id: session.user.id },
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
            accounts: {
              select: {
                provider: true,
                providerAccountId: true,
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
        const user = {
          ...userRaw,
          totalEarnings: userRaw.totalEarnings?.toString() || "0",
          totalViews: userRaw.totalViews?.toString() || "0"
        }

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
