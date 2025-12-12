// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"

/**
 * Admin endpoint to sync user.totalEarnings with actual clip earnings
 * 
 * This fixes drift that can occur from:
 * - Race conditions in view tracking
 * - Partial transaction failures
 * - Any manual SQL updates to clips
 * 
 * Should be run periodically (weekly) or when discrepancies are noticed
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id }
    })

    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { dryRun = true } = body

    console.log(`🔄 Earnings sync ${dryRun ? '(DRY RUN)' : '(LIVE)'} initiated by admin ${adminUser.email}`)

    // Step 1: Calculate correct earnings for each user from their clips
    const usersWithClipEarnings = await prisma.$queryRaw<Array<{
      userId: string
      email: string
      name: string | null
      currentBalance: number
      correctBalance: number
      difference: number
    }>>`
      SELECT 
        u.id as "userId",
        u.email,
        u.name,
        u."totalEarnings"::numeric as "currentBalance",
        COALESCE(SUM(cl.earnings::numeric), 0) as "correctBalance",
        (COALESCE(SUM(cl.earnings::numeric), 0) - u."totalEarnings"::numeric) as "difference"
      FROM users u
      LEFT JOIN clip_submissions cs ON cs."userId" = u.id AND cs.status = 'APPROVED'
      LEFT JOIN clips cl ON cl.id = cs."clipId"
      WHERE u.role = 'CLIPPER'
      GROUP BY u.id, u.email, u.name, u."totalEarnings"
      HAVING ABS(COALESCE(SUM(cl.earnings::numeric), 0) - u."totalEarnings"::numeric) > 0.01
      ORDER BY ABS(COALESCE(SUM(cl.earnings::numeric), 0) - u."totalEarnings"::numeric) DESC
    `

    console.log(`📊 Found ${usersWithClipEarnings.length} users with earnings discrepancies`)

    // Step 2: Calculate totals
    const totalCurrentBalance = usersWithClipEarnings.reduce((sum, u) => sum + Number(u.currentBalance), 0)
    const totalCorrectBalance = usersWithClipEarnings.reduce((sum, u) => sum + Number(u.correctBalance), 0)
    const totalDiscrepancy = totalCorrectBalance - totalCurrentBalance

    // Step 3: Apply fixes if not dry run
    const updates: Array<{
      userId: string
      email: string
      name: string | null
      oldBalance: number
      newBalance: number
      change: number
    }> = []

    if (!dryRun && usersWithClipEarnings.length > 0) {
      // Use a transaction for safety
      await prisma.$transaction(async (tx) => {
        for (const user of usersWithClipEarnings) {
          await tx.user.update({
            where: { id: user.userId },
            data: {
              totalEarnings: user.correctBalance,
              updatedAt: new Date()
            }
          })
          
          updates.push({
            userId: user.userId,
            email: user.email,
            name: user.name,
            oldBalance: Number(user.currentBalance),
            newBalance: Number(user.correctBalance),
            change: Number(user.difference)
          })
          
          console.log(`✅ Updated ${user.email}: $${user.currentBalance} → $${user.correctBalance} (${user.difference > 0 ? '+' : ''}$${user.difference})`)
        }
      })
    }

    // Step 4: Also sync campaign.spent if requested
    const campaignCheck = await prisma.$queryRaw<Array<{
      campaignId: string
      title: string
      currentSpent: number
      correctSpent: number
      difference: number
    }>>`
      SELECT 
        c.id as "campaignId",
        c.title,
        c.spent::numeric as "currentSpent",
        COALESCE(SUM(cl.earnings::numeric), 0) as "correctSpent",
        (COALESCE(SUM(cl.earnings::numeric), 0) - c.spent::numeric) as "difference"
      FROM campaigns c
      LEFT JOIN clip_submissions cs ON cs."campaignId" = c.id AND cs.status = 'APPROVED'
      LEFT JOIN clips cl ON cl.id = cs."clipId"
      WHERE c.status IN ('ACTIVE', 'COMPLETED')
      GROUP BY c.id, c.title, c.spent
      HAVING ABS(COALESCE(SUM(cl.earnings::numeric), 0) - c.spent::numeric) > 0.01
    `

    return NextResponse.json({
      success: true,
      dryRun,
      summary: {
        usersAffected: usersWithClipEarnings.length,
        totalCurrentBalance: totalCurrentBalance.toFixed(2),
        totalCorrectBalance: totalCorrectBalance.toFixed(2),
        totalDiscrepancy: totalDiscrepancy.toFixed(2),
        campaignsWithDiscrepancies: campaignCheck.length
      },
      userDiscrepancies: usersWithClipEarnings.map(u => ({
        email: u.email,
        name: u.name,
        currentBalance: Number(u.currentBalance).toFixed(2),
        correctBalance: Number(u.correctBalance).toFixed(2),
        difference: Number(u.difference).toFixed(2)
      })),
      campaignDiscrepancies: campaignCheck.map(c => ({
        title: c.title,
        currentSpent: Number(c.currentSpent).toFixed(2),
        correctSpent: Number(c.correctSpent).toFixed(2),
        difference: Number(c.difference).toFixed(2)
      })),
      updates: dryRun ? [] : updates.map(u => ({
        email: u.email,
        name: u.name,
        oldBalance: u.oldBalance.toFixed(2),
        newBalance: u.newBalance.toFixed(2),
        change: u.change.toFixed(2)
      })),
      message: dryRun 
        ? `Found ${usersWithClipEarnings.length} users with $${Math.abs(totalDiscrepancy).toFixed(2)} total discrepancy. Run with dryRun: false to apply fixes.`
        : `Fixed ${updates.length} users. Total adjustment: $${totalDiscrepancy.toFixed(2)}`
    })

  } catch (error) {
    console.error("❌ Error syncing earnings:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to check discrepancies without modifying
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id }
    })

    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Quick check for any discrepancies
    const totalUserBalances = await prisma.user.aggregate({
      where: { totalEarnings: { gt: 0 } },
      _sum: { totalEarnings: true }
    })

    const totalClipEarnings = await prisma.$queryRaw<[{ total: number }]>`
      SELECT SUM(cl.earnings::numeric) as total
      FROM clips cl
      JOIN clip_submissions cs ON cs."clipId" = cl.id
      WHERE cs.status = 'APPROVED'
    `

    const userTotal = Number(totalUserBalances._sum.totalEarnings || 0)
    const clipTotal = Number(totalClipEarnings[0]?.total || 0)
    const discrepancy = clipTotal - userTotal

    return NextResponse.json({
      totalUserBalances: userTotal.toFixed(2),
      totalClipEarnings: clipTotal.toFixed(2),
      discrepancy: discrepancy.toFixed(2),
      inSync: Math.abs(discrepancy) < 0.01,
      message: Math.abs(discrepancy) < 0.01 
        ? '✅ Earnings are in sync'
        : `⚠️ Discrepancy of $${Math.abs(discrepancy).toFixed(2)} detected. POST to this endpoint to fix.`
    })

  } catch (error) {
    console.error("Error checking earnings sync:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

