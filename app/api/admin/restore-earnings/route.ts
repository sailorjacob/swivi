// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"

/**
 * Admin-only endpoint to restore clip earnings from finalEarnings snapshots
 * and recalculate user totalEarnings
 * 
 * This fixes the issue where clip.earnings was accidentally reset to 0
 * during payout processing.
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

    const body = await request.json()
    const { dryRun = true } = body // Default to dry run for safety

    console.log(`🔧 Restore earnings ${dryRun ? '(DRY RUN)' : '(LIVE)'} initiated by admin ${adminUser.email}`)

    // Step 1: Find all submissions with finalEarnings that have clips with 0 earnings
    const submissionsToFix = await prisma.clipSubmission.findMany({
      where: {
        finalEarnings: { gt: 0 },
        clipId: { not: null },
        status: 'APPROVED',
        clips: {
          earnings: { equals: 0 }
        }
      },
      include: {
        clips: {
          select: {
            id: true,
            earnings: true,
            userId: true
          }
        },
        users: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        campaigns: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    })

    console.log(`📊 Found ${submissionsToFix.length} submissions with finalEarnings > 0 but clip.earnings = 0`)

    const restoredClips: Array<{
      clipId: string
      userId: string
      userEmail: string
      campaignTitle: string
      oldEarnings: number
      newEarnings: number
    }> = []

    // Step 2: Restore clip.earnings from finalEarnings
    for (const submission of submissionsToFix) {
      if (!submission.clips || !submission.clipId) continue

      const oldEarnings = Number(submission.clips.earnings)
      const newEarnings = Number(submission.finalEarnings)

      if (newEarnings > oldEarnings) {
        restoredClips.push({
          clipId: submission.clipId,
          userId: submission.users.id,
          userEmail: submission.users.email || 'unknown',
          campaignTitle: submission.campaigns.title,
          oldEarnings,
          newEarnings
        })

        if (!dryRun) {
          await prisma.clip.update({
            where: { id: submission.clipId },
            data: {
              earnings: newEarnings
            }
          })
          console.log(`✅ Restored clip ${submission.clipId} earnings: $${oldEarnings} → $${newEarnings}`)
        }
      }
    }

    // Step 3: Recalculate user totalEarnings based on their approved clip earnings
    // Group clips by user
    const userEarningsMap = new Map<string, {
      userId: string
      userEmail: string
      totalClipEarnings: number
    }>()

    for (const clip of restoredClips) {
      const existing = userEarningsMap.get(clip.userId)
      if (existing) {
        existing.totalClipEarnings += clip.newEarnings
      } else {
        userEarningsMap.set(clip.userId, {
          userId: clip.userId,
          userEmail: clip.userEmail,
          totalClipEarnings: clip.newEarnings
        })
      }
    }

    // Get current user totals
    const userUpdates: Array<{
      userId: string
      userEmail: string
      oldTotal: number
      newTotal: number
    }> = []

    for (const [userId, data] of userEarningsMap) {
      // Calculate actual total from all approved clips
      const userClips = await prisma.clipSubmission.findMany({
        where: {
          userId,
          status: 'APPROVED',
          clipId: { not: null }
        },
        include: {
          clips: {
            select: {
              earnings: true
            }
          }
        }
      })

      // Use the finalEarnings value if clip earnings is 0 (for clips we're about to restore)
      let totalFromClips = 0
      for (const sub of userClips) {
        // Check if this is one we're restoring
        const restoredClip = restoredClips.find(r => r.clipId === sub.clipId)
        if (restoredClip) {
          totalFromClips += restoredClip.newEarnings
        } else {
          totalFromClips += Number(sub.clips?.earnings || 0)
        }
      }

      // Get current user total
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { totalEarnings: true, email: true }
      })

      const oldTotal = Number(currentUser?.totalEarnings || 0)

      // Only update if the new total is higher (we might have already paid out some)
      if (totalFromClips > oldTotal) {
        userUpdates.push({
          userId,
          userEmail: currentUser?.email || 'unknown',
          oldTotal,
          newTotal: totalFromClips
        })

        if (!dryRun) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              totalEarnings: totalFromClips
            }
          })
          console.log(`✅ Updated user ${currentUser?.email} totalEarnings: $${oldTotal} → $${totalFromClips}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      summary: {
        clipsToRestore: restoredClips.length,
        usersToUpdate: userUpdates.length,
        totalEarningsToRestore: restoredClips.reduce((sum, c) => sum + (c.newEarnings - c.oldEarnings), 0)
      },
      clipDetails: restoredClips,
      userDetails: userUpdates,
      message: dryRun 
        ? 'DRY RUN: No changes made. Set dryRun: false to apply changes.'
        : 'Changes applied successfully!'
    })

  } catch (error) {
    console.error("Error restoring earnings:", error)
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to check current state
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

    // Find discrepancies
    const submissionsWithMismatch = await prisma.clipSubmission.findMany({
      where: {
        OR: [
          // Has finalEarnings but clip has 0
          {
            finalEarnings: { gt: 0 },
            clipId: { not: null },
            clips: { earnings: { equals: 0 } }
          },
          // Has finalEarnings different from clip earnings
          {
            finalEarnings: { gt: 0 },
            clipId: { not: null }
          }
        ],
        status: 'APPROVED'
      },
      include: {
        clips: {
          select: {
            id: true,
            earnings: true
          }
        },
        users: {
          select: {
            id: true,
            email: true,
            totalEarnings: true
          }
        },
        campaigns: {
          select: {
            title: true,
            status: true
          }
        }
      }
    })

    const discrepancies = submissionsWithMismatch
      .filter(s => s.clips && Number(s.clips.earnings) !== Number(s.finalEarnings))
      .map(s => ({
        submissionId: s.id,
        clipId: s.clipId,
        userEmail: s.users.email,
        userTotalEarnings: Number(s.users.totalEarnings),
        campaignTitle: s.campaigns.title,
        campaignStatus: s.campaigns.status,
        clipEarnings: Number(s.clips?.earnings || 0),
        finalEarnings: Number(s.finalEarnings || 0),
        difference: Number(s.finalEarnings || 0) - Number(s.clips?.earnings || 0)
      }))

    return NextResponse.json({
      discrepanciesFound: discrepancies.length,
      totalMissingEarnings: discrepancies.reduce((sum, d) => sum + Math.max(0, d.difference), 0),
      discrepancies
    })

  } catch (error) {
    console.error("Error checking earnings:", error)
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

