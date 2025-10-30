#!/usr/bin/env node

/**
 * Recalculate User.totalViews and User.totalEarnings from actual clip data
 * 
 * This script fixes the discrepancy between cached User table values 
 * and real-time clip data by recalculating from actual clip submissions.
 * 
 * Usage:
 *   node scripts/recalculate-user-totals.js [--dry-run] [--user-id=USER_ID]
 * 
 * Options:
 *   --dry-run    Show what would be updated without making changes
 *   --user-id    Only recalculate for a specific user ID
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Parse command line arguments
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const userIdArg = args.find(arg => arg.startsWith('--user-id='))
const specificUserId = userIdArg ? userIdArg.split('=')[1] : null

async function calculateUserTotals(userId) {
  // Get all approved submissions with their clips and latest view tracking
  const submissions = await prisma.clipSubmission.findMany({
    where: {
      userId,
      status: 'APPROVED'
    },
    include: {
      clips: {
        select: {
          id: true,
          earnings: true,
          view_tracking: {
            orderBy: { date: 'desc' },
            take: 1,
            select: {
              views: true
            }
          }
        }
      }
    }
  })

  // Calculate totals from actual clip data
  let totalEarnings = 0
  let totalViews = 0

  for (const submission of submissions) {
    if (submission.clips) {
      // Add earnings
      totalEarnings += Number(submission.clips.earnings || 0)

      // Add latest view count
      if (submission.clips.view_tracking && submission.clips.view_tracking.length > 0) {
        totalViews += Number(submission.clips.view_tracking[0].views || 0)
      }
    }
  }

  return {
    totalEarnings,
    totalViews,
    submissionCount: submissions.length
  }
}

async function recalculateAllUsers() {
  console.log('🔄 Starting user totals recalculation...\n')

  // Get all users (or specific user if provided)
  const whereClause = specificUserId ? { id: specificUserId } : {}
  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      email: true,
      name: true,
      totalEarnings: true,
      totalViews: true
    },
    orderBy: { createdAt: 'desc' }
  })

  console.log(`📊 Found ${users.length} user(s) to process\n`)

  let updatedCount = 0
  let noChangeCount = 0
  let totalViewsDiff = 0
  let totalEarningsDiff = 0

  const updates = []

  for (const user of users) {
    const currentEarnings = Number(user.totalEarnings)
    const currentViews = Number(user.totalViews)

    const calculated = await calculateUserTotals(user.id)

    const earningsDiff = calculated.totalEarnings - currentEarnings
    const viewsDiff = calculated.totalViews - currentViews

    totalViewsDiff += viewsDiff
    totalEarningsDiff += earningsDiff

    if (viewsDiff !== 0 || earningsDiff !== 0) {
      updatedCount++
      
      const displayName = user.name || user.email || user.id

      console.log(`\n📝 User: ${displayName}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Approved Submissions: ${calculated.submissionCount}`)
      console.log(`   Views:    ${currentViews.toLocaleString()} → ${calculated.totalViews.toLocaleString()} (${viewsDiff > 0 ? '+' : ''}${viewsDiff.toLocaleString()})`)
      console.log(`   Earnings: $${currentEarnings.toFixed(2)} → $${calculated.totalEarnings.toFixed(2)} (${earningsDiff > 0 ? '+' : ''}$${earningsDiff.toFixed(2)})`)

      updates.push({
        userId: user.id,
        email: user.email,
        name: displayName,
        currentViews,
        newViews: calculated.totalViews,
        viewsDiff,
        currentEarnings,
        newEarnings: calculated.totalEarnings,
        earningsDiff
      })
    } else {
      noChangeCount++
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('📊 SUMMARY')
  console.log('='.repeat(80))
  console.log(`Total Users Processed: ${users.length}`)
  console.log(`Users Needing Update: ${updatedCount}`)
  console.log(`Users Already Correct: ${noChangeCount}`)
  console.log(`Total Views Difference: ${totalViewsDiff > 0 ? '+' : ''}${totalViewsDiff.toLocaleString()}`)
  console.log(`Total Earnings Difference: ${totalEarningsDiff > 0 ? '+' : ''}$${totalEarningsDiff.toFixed(2)}`)
  console.log('='.repeat(80) + '\n')

  if (dryRun) {
    console.log('🔍 DRY RUN - No changes were made')
    console.log('   Run without --dry-run to apply these changes\n')
  } else if (updatedCount > 0) {
    console.log('💾 Applying updates to database...\n')

    for (const update of updates) {
      await prisma.user.update({
        where: { id: update.userId },
        data: {
          totalViews: update.newViews,
          totalEarnings: update.newEarnings,
          updatedAt: new Date()
        }
      })
      console.log(`✅ Updated ${update.name || update.email}`)
    }

    console.log(`\n✅ Successfully updated ${updatedCount} user(s)`)
  } else {
    console.log('✅ All users already have correct totals - no updates needed\n')
  }

  // Verify the updates
  if (!dryRun && updatedCount > 0) {
    console.log('\n' + '='.repeat(80))
    console.log('🔍 VERIFICATION')
    console.log('='.repeat(80))

    const topUsers = await prisma.user.findMany({
      where: specificUserId ? { id: specificUserId } : {},
      select: {
        email: true,
        name: true,
        totalViews: true,
        totalEarnings: true,
        _count: {
          select: {
            clipSubmissions: true
          }
        }
      },
      orderBy: { totalViews: 'desc' },
      take: 10
    })

    console.log('\nTop Users by Views:')
    for (const user of topUsers) {
      const displayName = user.name || user.email || 'Unknown'
      console.log(`  ${displayName}: ${Number(user.totalViews).toLocaleString()} views, $${Number(user.totalEarnings).toFixed(2)} earnings, ${user._count.clipSubmissions} submissions`)
    }
  }
}

async function main() {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('USER TOTALS RECALCULATION')
    console.log('='.repeat(80))
    
    if (dryRun) {
      console.log('🔍 Running in DRY RUN mode - no changes will be made')
    }
    
    if (specificUserId) {
      console.log(`👤 Processing specific user: ${specificUserId}`)
    }
    
    console.log('='.repeat(80) + '\n')

    await recalculateAllUsers()

  } catch (error) {
    console.error('\n❌ Error recalculating user totals:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

