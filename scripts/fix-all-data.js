#!/usr/bin/env node

/**
 * FIX ALL DATA ISSUES - One Script to Rule Them All
 * 
 * This script fixes BOTH issues:
 * 1. User total views (profile page showing wrong cached number)
 * 2. Campaign spend (showing $1,586 instead of $2,449)
 * 
 * Usage:
 *   node scripts/fix-all-data.js --preview  (safe, shows what will change)
 *   node scripts/fix-all-data.js --fix      (applies the fixes)
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const args = process.argv.slice(2)
const isPreview = args.includes('--preview')
const isFix = args.includes('--fix')

if (!isPreview && !isFix) {
  console.log('\n⚠️  Please specify --preview or --fix\n')
  console.log('Examples:')
  console.log('  node scripts/fix-all-data.js --preview   (safe, just shows what will change)')
  console.log('  node scripts/fix-all-data.js --fix       (applies the changes)\n')
  process.exit(1)
}

// ============================================================================
// PART 1: Fix User Total Views
// ============================================================================
async function fixUserTotalViews() {
  console.log('\n' + '='.repeat(80))
  console.log('PART 1: FIXING USER TOTAL VIEWS (Profile Page)')
  console.log('='.repeat(80))
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      totalViews: true,
      totalEarnings: true
    }
  })

  let usersFixed = 0
  const updates = []

  for (const user of users) {
    // Calculate correct totals from actual clips
    const submissions = await prisma.clipSubmission.findMany({
      where: {
        userId: user.id,
        status: 'APPROVED'
      },
      include: {
        clips: {
          select: {
            earnings: true,
            view_tracking: {
              orderBy: { date: 'desc' },
              take: 1,
              select: { views: true }
            }
          }
        }
      }
    })

    let correctViews = 0
    let correctEarnings = 0

    for (const submission of submissions) {
      if (submission.clips) {
        correctEarnings += Number(submission.clips.earnings || 0)
        if (submission.clips.view_tracking?.[0]) {
          correctViews += Number(submission.clips.view_tracking[0].views || 0)
        }
      }
    }

    const viewsDiff = correctViews - Number(user.totalViews)
    const earningsDiff = correctEarnings - Number(user.totalEarnings)

    if (Math.abs(viewsDiff) > 1 || Math.abs(earningsDiff) > 0.01) {
      usersFixed++
      
      console.log(`\n${user.email || user.name || user.id}:`)
      console.log(`  Views:    ${Number(user.totalViews).toLocaleString()} → ${correctViews.toLocaleString()} (${viewsDiff > 0 ? '+' : ''}${viewsDiff.toLocaleString()})`)
      console.log(`  Earnings: $${Number(user.totalEarnings).toFixed(2)} → $${correctEarnings.toFixed(2)} (${earningsDiff > 0 ? '+' : ''}$${earningsDiff.toFixed(2)})`)
      
      updates.push({
        userId: user.id,
        correctViews,
        correctEarnings
      })
    }
  }

  console.log(`\n✅ Found ${usersFixed} user(s) that need fixing`)

  if (isFix && updates.length > 0) {
    console.log('\n💾 Applying updates...')
    for (const update of updates) {
      await prisma.user.update({
        where: { id: update.userId },
        data: {
          totalViews: update.correctViews,
          totalEarnings: update.correctEarnings
        }
      })
    }
    console.log('✅ All user totals fixed!')
  }

  return { fixed: usersFixed, updates }
}

// ============================================================================
// PART 2: Fix Campaign Spend
// ============================================================================
async function fixCampaignSpend() {
  console.log('\n' + '='.repeat(80))
  console.log('PART 2: FIXING CAMPAIGN SPEND ($863 DISCREPANCY)')
  console.log('='.repeat(80))

  const campaigns = await prisma.campaign.findMany({
    where: {
      status: { in: ['ACTIVE', 'PAUSED', 'COMPLETED'] }
    },
    select: { id: true }
  })

  let campaignsFixed = 0
  const updates = []

  for (const campaign of campaigns) {
    const fullCampaign = await prisma.campaign.findUnique({
      where: { id: campaign.id },
      include: {
        clipSubmissions: {
          where: { status: 'APPROVED' },
          include: {
            clips: { select: { earnings: true } }
          }
        }
      }
    })

    if (!fullCampaign) continue

    // Calculate actual spend from clip earnings
    let actualSpent = 0
    for (const submission of fullCampaign.clipSubmissions) {
      if (submission.clips) {
        actualSpent += Number(submission.clips.earnings || 0)
      }
    }

    const recordedSpent = Number(fullCampaign.spent || 0)
    const difference = actualSpent - recordedSpent

    if (Math.abs(difference) > 0.01) {
      campaignsFixed++
      
      console.log(`\n${fullCampaign.title}:`)
      console.log(`  Budget:   $${Number(fullCampaign.budget).toFixed(2)}`)
      console.log(`  Recorded: $${recordedSpent.toFixed(2)} ❌`)
      console.log(`  Actual:   $${actualSpent.toFixed(2)} ✅`)
      console.log(`  Missing:  $${Math.abs(difference).toFixed(2)} ${difference > 0 ? '⚠️ NEEDS FIXING' : ''}`)
      console.log(`  Approved Clips: ${fullCampaign.clipSubmissions.length}`)
      
      updates.push({
        campaignId: fullCampaign.id,
        title: fullCampaign.title,
        actualSpent
      })
    }
  }

  console.log(`\n✅ Found ${campaignsFixed} campaign(s) that need fixing`)

  if (isFix && updates.length > 0) {
    console.log('\n💾 Applying updates...')
    for (const update of updates) {
      await prisma.campaign.update({
        where: { id: update.campaignId },
        data: { spent: update.actualSpent }
      })
      console.log(`✅ Fixed: ${update.title}`)
    }
    console.log('✅ All campaign spend fixed!')
  }

  return { fixed: campaignsFixed, updates }
}

// ============================================================================
// MAIN
// ============================================================================
async function main() {
  console.log('\n' + '='.repeat(80))
  console.log('🔧 DATA FIX UTILITY')
  console.log('='.repeat(80))
  
  if (isPreview) {
    console.log('🔍 PREVIEW MODE - No changes will be made')
  } else {
    console.log('💾 FIX MODE - Changes will be applied')
  }
  
  console.log('='.repeat(80))

  try {
    // Fix both issues
    const userResults = await fixUserTotalViews()
    const campaignResults = await fixCampaignSpend()

    // Summary
    console.log('\n' + '='.repeat(80))
    console.log('📊 SUMMARY')
    console.log('='.repeat(80))
    console.log(`Users Fixed: ${userResults.fixed}`)
    console.log(`Campaigns Fixed: ${campaignResults.fixed}`)
    
    if (isPreview) {
      console.log('\n⚠️  This was a PREVIEW. Run with --fix to apply these changes.')
      console.log('Command: node scripts/fix-all-data.js --fix')
    } else {
      console.log('\n✅ ALL FIXES APPLIED SUCCESSFULLY!')
      console.log('\nWhat to check:')
      console.log('  1. Go to your profile page - views should be correct now')
      console.log('  2. Go to campaign dashboard - spend should match your earnings now')
      console.log('  3. Everything should be consistent!')
    }
    console.log('='.repeat(80) + '\n')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

