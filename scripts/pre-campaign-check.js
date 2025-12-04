/**
 * Pre-Campaign Health Check Script
 * Run before launching a major campaign to verify system integrity
 * 
 * Usage: node scripts/pre-campaign-check.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function runHealthCheck() {
  console.log('\n🔍 SWIVI Pre-Campaign Health Check\n')
  console.log('='.repeat(60))
  
  const issues = []
  const warnings = []
  
  try {
    // 1. Check Campaign Spend Sync
    console.log('\n📊 1. Checking Campaign Spend Consistency...')
    const campaigns = await prisma.campaign.findMany({
      where: { status: { in: ['ACTIVE', 'SCHEDULED'] } },
      select: {
        id: true,
        title: true,
        budget: true,
        spent: true,
        status: true,
        clipSubmissions: {
          where: {
            status: 'APPROVED',
            clipId: { not: null }
          },
          include: {
            clips: {
              select: { earnings: true }
            }
          }
        }
      }
    })
    
    for (const campaign of campaigns) {
      const actualSpent = campaign.clipSubmissions.reduce((sum, sub) => {
        return sum + Number(sub.clips?.earnings || 0)
      }, 0)
      const recordedSpent = Number(campaign.spent || 0)
      const diff = Math.abs(actualSpent - recordedSpent)
      
      if (diff > 0.01) {
        issues.push(`Campaign "${campaign.title}": Recorded $${recordedSpent.toFixed(2)} but actual is $${actualSpent.toFixed(2)} (diff: $${diff.toFixed(2)})`)
      } else {
        console.log(`   ✅ ${campaign.title}: $${recordedSpent.toFixed(2)} (synced)`)
      }
    }
    
    // 2. Check for orphaned clips (earnings without approved submission)
    console.log('\n📎 2. Checking for Orphaned Clips...')
    const orphanedClips = await prisma.clip.findMany({
      where: {
        earnings: { gt: 0 },
        clipSubmissions: {
          none: {
            status: 'APPROVED'
          }
        }
      },
      select: {
        id: true,
        url: true,
        earnings: true
      }
    })
    
    if (orphanedClips.length > 0) {
      warnings.push(`${orphanedClips.length} clips have earnings but no APPROVED submission`)
    } else {
      console.log('   ✅ No orphaned clips found')
    }
    
    // 3. Check User Earnings Consistency
    console.log('\n👤 3. Checking User Earnings Consistency...')
    const usersWithEarnings = await prisma.user.findMany({
      where: { totalEarnings: { gt: 0 } },
      select: {
        id: true,
        email: true,
        totalEarnings: true,
        clipSubmissions: {
          where: { status: 'APPROVED' },
          include: {
            clips: { select: { earnings: true } },
            campaigns: { select: { status: true } }
          }
        }
      },
      take: 50
    })
    
    let userMismatches = 0
    for (const user of usersWithEarnings) {
      // Only check against active campaign earnings (completed campaigns might have been paid out)
      const activeEarnings = user.clipSubmissions
        .filter(s => s.campaigns.status === 'ACTIVE')
        .reduce((sum, s) => sum + Number(s.clips?.earnings || 0), 0)
      
      // User totalEarnings should be >= active campaign earnings
      if (Number(user.totalEarnings) < activeEarnings - 0.01) {
        userMismatches++
        warnings.push(`User ${user.email}: totalEarnings ($${Number(user.totalEarnings).toFixed(2)}) less than active clip earnings ($${activeEarnings.toFixed(2)})`)
      }
    }
    
    if (userMismatches === 0) {
      console.log('   ✅ User earnings look consistent')
    }
    
    // 4. Check Pending Payout Requests
    console.log('\n💸 4. Checking Pending Payout Requests...')
    const pendingPayouts = await prisma.payoutRequest.findMany({
      where: { status: { in: ['PENDING', 'APPROVED', 'PROCESSING'] } },
      include: {
        users: {
          select: { email: true, totalEarnings: true }
        }
      }
    })
    
    if (pendingPayouts.length > 0) {
      console.log(`   ⚠️  ${pendingPayouts.length} pending payout request(s):`)
      for (const pr of pendingPayouts) {
        console.log(`      - ${pr.users.email}: $${Number(pr.amount).toFixed(2)} (${pr.status})`)
      }
    } else {
      console.log('   ✅ No pending payout requests')
    }
    
    // 5. Check Recent Cron Job Logs
    console.log('\n⏰ 5. Checking Recent Cron Job Logs...')
    const recentLogs = await prisma.cronJobLog.findMany({
      orderBy: { startedAt: 'desc' },
      take: 5
    })
    
    if (recentLogs.length === 0) {
      warnings.push('No cron job logs found - view tracking may not be running!')
    } else {
      const lastRun = recentLogs[0]
      const hoursSinceLastRun = (Date.now() - lastRun.startedAt.getTime()) / (1000 * 60 * 60)
      
      if (hoursSinceLastRun > 1) {
        warnings.push(`Last cron run was ${hoursSinceLastRun.toFixed(1)} hours ago`)
      }
      
      console.log(`   Last run: ${lastRun.startedAt.toISOString()}`)
      console.log(`   Status: ${lastRun.status}`)
      console.log(`   Clips processed: ${lastRun.clipsProcessed || 0}`)
      console.log(`   Earnings calculated: $${Number(lastRun.earningsCalculated || 0).toFixed(2)}`)
      
      const recentFailures = recentLogs.filter(l => l.status === 'FAILED').length
      if (recentFailures > 2) {
        issues.push(`${recentFailures} failed cron jobs in last 5 runs`)
      }
    }
    
    // 6. Check Campaign Budget Status
    console.log('\n💰 6. Checking Active Campaign Budgets...')
    for (const campaign of campaigns.filter(c => c.status === 'ACTIVE')) {
      const budget = Number(campaign.budget)
      const spent = Number(campaign.spent || 0)
      const remaining = budget - spent
      const percentage = (spent / budget * 100).toFixed(1)
      
      console.log(`   ${campaign.title}:`)
      console.log(`      Budget: $${budget.toFixed(2)}`)
      console.log(`      Spent: $${spent.toFixed(2)} (${percentage}%)`)
      console.log(`      Remaining: $${remaining.toFixed(2)}`)
      
      if (remaining < 100) {
        warnings.push(`Campaign "${campaign.title}" has only $${remaining.toFixed(2)} remaining`)
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📋 SUMMARY')
    console.log('='.repeat(60))
    
    if (issues.length > 0) {
      console.log('\n❌ ISSUES (must fix before campaign):')
      issues.forEach((issue, i) => console.log(`   ${i + 1}. ${issue}`))
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️  WARNINGS (review before campaign):')
      warnings.forEach((warning, i) => console.log(`   ${i + 1}. ${warning}`))
    }
    
    if (issues.length === 0 && warnings.length === 0) {
      console.log('\n✅ ALL CHECKS PASSED - System is healthy!')
    } else if (issues.length === 0) {
      console.log(`\n🟡 ${warnings.length} warning(s) - Review before proceeding`)
    } else {
      console.log(`\n🔴 ${issues.length} issue(s) found - Fix before launching campaign!`)
    }
    
    console.log('\n')
    
  } catch (error) {
    console.error('\n❌ Error running health check:', error)
  } finally {
    await prisma.$disconnect()
  }
}

runHealthCheck()

