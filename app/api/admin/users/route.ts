// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  console.log("🔍 Admin users API called - START")
  console.log("Request URL:", request.url)
  console.log("Request method:", request.method)
  console.log("Timestamp:", new Date().toISOString())

  try {
    // Authenticate and check admin status
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      console.log("❌ Admin authentication failed:", error?.message)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { role: true }
    })

    if (!dbUser || dbUser.role !== "ADMIN") {
      console.log("❌ Admin access required")
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    console.log("✅ Admin authenticated:", user.email, "Role:", dbUser.role)

    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")
    const limit = parseInt(searchParams.get("limit") || "200")
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

      // Execute main query with complete select including stats, social accounts, and payout info
      console.log("🔍 Executing main users query...")
      users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
          totalViews: true,
          totalEarnings: true,
          // Payout information
          paypalEmail: true,
          walletAddress: true,
          bitcoinAddress: true,
          // Include submissions count
          _count: {
            select: {
              clipSubmissions: true,
              payoutRequests: true
            }
          },
          // Include verified social accounts
          socialAccounts: {
            where: {
              verified: true
            },
            select: {
              id: true,
              platform: true,
              username: true,
              displayName: true,
              verifiedAt: true,
              followers: true
            },
            orderBy: {
              platform: "asc"
            }
          },
          // Include pending payout requests
          payoutRequests: {
            where: {
              status: { in: ['PENDING', 'APPROVED', 'PROCESSING'] }
            },
            select: {
              id: true,
              amount: true,
              status: true,
              paymentMethod: true,
              requestedAt: true
            },
            orderBy: {
              requestedAt: 'desc'
            },
            take: 1
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        take: Math.min(limit, 200), // Allow up to 200 users per request
        skip: offset
      })
      console.log("✅ Users fetched:", users.length)

      // Convert Decimal and BigInt to regular numbers for JSON serialization
      const processedUsers = users.map(user => ({
        ...user,
        totalViews: Number(user.totalViews),
        totalEarnings: Number(user.totalEarnings),
        pendingPayoutRequest: user.payoutRequests?.[0] ? {
          id: user.payoutRequests[0].id,
          amount: Number(user.payoutRequests[0].amount),
          status: user.payoutRequests[0].status,
          paymentMethod: user.payoutRequests[0].paymentMethod,
          requestedAt: user.payoutRequests[0].requestedAt
        } : null,
        payoutRequests: undefined // Remove full array from response
      }))

      // Get total count and role counts
      const [totalFiltered, totalAll, adminCount, clipperCount] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.count(),
        prisma.user.count({ where: { role: 'ADMIN' } }),
        prisma.user.count({ where: { role: 'CLIPPER' } })
      ])
      total = totalFiltered
      console.log("✅ Total count:", total, "Admin:", adminCount, "Clipper:", clipperCount)

      return NextResponse.json({
        users: processedUsers,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        },
        stats: {
          totalUsers: totalAll,
          adminCount,
          clipperCount
        }
      })
    } catch (queryError) {
      console.error("❌ Database query error:", queryError)

      // Type guard for query error
      const error = queryError as Error & { message?: string; code?: string }
      return NextResponse.json({
        error: "Database query error",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 500 })
    }
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
