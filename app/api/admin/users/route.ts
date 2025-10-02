import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Admin users API called")
    console.log("Request headers:", Object.fromEntries(request.headers.entries()))

    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError) {
      console.error("❌ Session error:", sessionError)
      return NextResponse.json({
        error: "Session error",
        details: process.env.NODE_ENV === 'development' ? sessionError.message : undefined
      }, { status: 500 })
    }

    console.log("Session details:", {
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userRole: session?.user?.role,
      hasSession: !!session
    })

    if (!session?.user?.id) {
      console.log("❌ No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    console.log("🔍 Checking admin status for user:", session.user.id)

    let user
    try {
      user = await prisma.user.findUnique({
        where: { id: session.user.id }
      })
    } catch (dbError) {
      console.error("❌ Database error during user lookup:", dbError)
      return NextResponse.json({
        error: "Database error",
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      }, { status: 500 })
    }

    console.log("User found:", user ? "yes" : "no", "Role:", user?.role)

    if (!user || user.role !== "ADMIN") {
      console.log("❌ Admin access denied")
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")
    const limit = parseInt(searchParams.get("limit") || "100")
    const offset = parseInt(searchParams.get("offset") || "0")

    console.log("🔍 Query params:", { role, limit, offset })

    const where: any = {}

    if (role && role !== "all") {
      console.log("🔍 Filtering by role:", role)
      where.role = role
    } else {
      console.log("🔍 Fetching all users")
    }

    console.log("🔍 Executing database query...")

    let users, total
    try {
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
          _count: {
            select: {
              submissions: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        take: limit,
        skip: offset
      })
      console.log("✅ Users fetched:", users.length)

      total = await prisma.user.count({ where })
      console.log("✅ Total count:", total)
    } catch (queryError) {
      console.error("❌ Database query error:", queryError)
      return NextResponse.json({
        error: "Database query error",
        details: process.env.NODE_ENV === 'development' ? queryError.message : undefined
      }, { status: 500 })
    }

    return NextResponse.json({
      users,
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
