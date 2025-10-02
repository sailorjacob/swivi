import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  console.log("🔍 Admin users API called - START")
  console.log("Request URL:", request.url)
  console.log("Request method:", request.method)
  console.log("Timestamp:", new Date().toISOString())

  try {
    // Log request headers for debugging
    const headers = Object.fromEntries(request.headers.entries())
    console.log("Request headers:", {
      'user-agent': headers['user-agent']?.substring(0, 100) + '...',
      'cookie': headers['cookie']?.substring(0, 100) + '...',
      'authorization': headers['authorization'] ? '[PRESENT]' : '[NOT PRESENT]',
      'content-type': headers['content-type']
    })

    // Try to get session - this is where the error might be occurring
    console.log("🔍 Attempting to get session...")
    let session
    try {
      session = await getServerSession(authOptions)
      console.log("✅ Session retrieved successfully")
    } catch (sessionError) {
      console.error("❌ Session error:", sessionError)
      console.error("Session error stack:", sessionError instanceof Error ? sessionError.stack : 'No stack')

      // Check for specific error types
      if (sessionError instanceof Error) {
        if (sessionError.message?.includes('cookie') || sessionError.message?.includes('parse')) {
          console.error("❌ Cookie/session parsing error")
          return NextResponse.json({
            error: "Invalid session format",
            details: process.env.NODE_ENV === 'development' ? sessionError.message : undefined
          }, { status: 400 })
        }

        if (sessionError.message?.includes('JWT') || sessionError.message?.includes('token')) {
          console.error("❌ JWT token error")
          return NextResponse.json({
            error: "Invalid authentication token",
            details: process.env.NODE_ENV === 'development' ? sessionError.message : undefined
          }, { status: 401 })
        }
      }

      // Generic session error
      console.error("❌ Returning 500 for session error")
      return NextResponse.json({
        error: "Session processing error",
        details: process.env.NODE_ENV === 'development' ? (sessionError instanceof Error ? sessionError.message : 'Unknown error') : undefined
      }, { status: 500 })
    }

    console.log("Session details:", {
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userRole: session?.user?.role,
      hasSession: !!session
    })

    if (!session?.user?.id) {
      console.log("❌ No session found - user not authenticated")
      return NextResponse.json({
        error: "Authentication required",
        details: "Please sign in to access admin features"
      }, { status: 401 })
    }

    // Check if user is admin
    console.log("🔍 Checking admin status for user:", session.user.id)

    let user
    try {
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true }
      })
      console.log("✅ User lookup successful")
    } catch (dbError) {
      console.error("❌ Database error during user lookup:", dbError)
      return NextResponse.json({
        error: "Database error during user lookup",
        details: process.env.NODE_ENV === 'development' ? (dbError instanceof Error ? dbError.message : 'Unknown error') : undefined
      }, { status: 500 })
    }

    console.log("User found:", user ? "yes" : "no", "Role:", user?.role)

    if (!user || user.role !== "ADMIN") {
      console.log("❌ Admin access denied - user role:", user?.role || "undefined")
      return NextResponse.json({
        error: "Admin access required",
        details: `Current role: ${user?.role || "unknown"}. Admin privileges required.`
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")
    const limit = parseInt(searchParams.get("limit") || "100")
    const offset = parseInt(searchParams.get("offset") || "0")

    console.log("🔍 Query params:", { role, limit, offset })

    // Build where clause for filtering
    const where: any = {}
    if (role && role !== "all") {
      console.log("🔍 Filtering by role:", role)
      where.role = role.toUpperCase() // Ensure role is uppercase to match enum
    } else {
      console.log("🔍 Fetching all users")
    }

    console.log("🔍 Executing database query...")

    let users, total
    try {
      // Test database connection first
      console.log("🔍 Testing database connection...")
      const testQuery = await prisma.user.count()
      console.log("✅ Database connection test passed, found", testQuery, "users")

      // Execute main query with complete select including stats
      console.log("🔍 Executing main users query...")
      users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          totalViews: true,
          totalEarnings: true,
          // Include submissions count
          _count: {
            select: {
              submissions: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        take: Math.min(limit, 50), // Reduce limit to avoid timeouts
        skip: offset
      })
      console.log("✅ Users fetched:", users.length)

      // Convert Decimal and BigInt to regular numbers for JSON serialization
      const processedUsers = users.map(user => ({
        ...user,
        totalViews: Number(user.totalViews),
        totalEarnings: Number(user.totalEarnings),
      }))

      // Get total count
      total = await prisma.user.count({ where })
      console.log("✅ Total count:", total)
    } catch (queryError) {
      console.error("❌ Database query error:", queryError)

      // Type guard for query error
      const error = queryError as Error & { message?: string; code?: string }
      return NextResponse.json({
        error: "Database query error",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 500 })
    }

    return NextResponse.json({
      users: processedUsers,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error("❌ Error fetching users:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      code: error && typeof error === 'object' && 'code' in error ? error.code : undefined
    })

    // Check for specific database errors
    const isDatabaseError = error instanceof Error && (
      error.message.includes('connect') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('timeout') ||
      error.message.includes('prisma')
    )

    return NextResponse.json({
      error: isDatabaseError ? "Database connection error" : "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
    }, { status: 500 })
  }
}
