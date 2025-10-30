#!/usr/bin/env node

/**
 * Sync Campaign Spend with Actual Clip Earnings
 * 
 * This script recalculates campaign.spent to match the actual sum of
 * clip.earnings for all approved submissions in that campaign.
 * 
 * Usage:
 *   node scripts/sync-campaign-spend.js [--dry-run] [--campaign-id=CAMPAIGN_ID]
 * 
 * Options:
 *   --dry-run      Show what would be updated without making changes
 *   --campaign-id  Only sync a specific campaign ID
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Parse command line arguments
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const campaignIdArg = args.find(arg => arg.startsWith('--campaign-id='))
const specificCampaignId = campaignIdArg ? campaignIdArg.split('=')[1] : null

async function calculateCampaignActualSpend(campaignId) {
  // Get campaign with all approved submissions and their clip earnings
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      clipSubmissions: {
        where: {
          status: 'APPROVED'
        },
        include: {
          clips: {
            select: {
              earnings: true
            }
          }
        }
      }
    }
  })

  if (!campaign) {
    return null
  }

  // Calculate actual total earnings from all approved clips
  let actualSpent = 0
  for (const submission of campaign.clipSubmissions) {
    if (submission.clips) {
      actualSpent += Number(submission.clips.earnings || 0)
    }
  }

  const recordedSpent = Number(campaign.spent || 0)
  const difference = actualSpent - recordedSpent

  return {
    campaignId: campaign.id,
    title: campaign.title,
    status: campaign.status,
    budget: Number(campaign.budget),
    recordedSpent,
    actualSpent,
    difference,
    approvedClips: campaign.clipSubmissions.length,
    hasDiscrepancy: Math.abs(difference) > 0.01, // Allow for rounding errors
    utilizationBefore: (recordedSpent / Number(campaign.budget)) * 100,
    utilizationAfter: (actualSpent / Number(campaign.budget)) * 100
  }
}

async function syncAllCampaigns() {
  console.log('\n' + '='.repeat(80))
  console.log('CAMPAIGN SPEND SYNCHRONIZATION')
  console.log('='.repeat(80))
  
  if (dryRun) {
    console.log('🔍 Running in DRY RUN mode - no changes will be made')
  } else {
    console.log('💾 Running in LIVE mode - changes will be applied')
  }
  
  if (specificCampaignId) {
    console.log(`👤 Processing specific campaign: ${specificCampaignId}`)
  }
  
  console.log('='.repeat(80) + '\n')

  // Get campaigns (or specific one)
  const whereClause = specificCampaignId 
    ? { id: specificCampaignId } 
    : { status: { in: ['ACTIVE', 'PAUSED', 'COMPLETED'] } }
  
  const campaigns = await prisma.campaign.findMany({
    where: whereClause,
    select: {
      id: true
    },
    orderBy: { createdAt: 'desc' }
  })

  console.log(`📊 Found ${campaigns.length} campaign(s) to check\n`)

  const results = []
  let campaignsWithDiscrepancies = 0
  let totalDifference = 0

  for (const campaign of campaigns) {
    const result = await calculateCampaignActualSpend(campaign.id)
    
    if (result) {
      results.push(result)
      
      if (result.hasDiscrepancy) {
        campaignsWithDiscrepancies++
        totalDifference += Math.abs(result.difference)
        
        console.log(`\n${result.difference > 0 ? '⚠️ ' : '✅ '} Campaign: ${result.title}`)
        console.log(`    ID: ${result.campaignId}`)
        console.log(`    Status: ${result.status}`)
        console.log(`    Budget: $${result.budget.toFixed(2)}`)
        console.log(`    Recorded Spent: $${result.recordedSpent.toFixed(2)} (${result.utilizationBefore.toFixed(1)}%)`)
        console.log(`    Actual Spent: $${result.actualSpent.toFixed(2)} (${result.utilizationAfter.toFixed(1)}%)`)
        console.log(`    Difference: ${result.difference > 0 ? '+' : ''}$${result.difference.toFixed(2)}`)
        console.log(`    Approved Clips: ${result.approvedClips}`)
        
        if (!dryRun) {
          console.log(`    🔧 Syncing...`)
          
          // Update campaign.spent to match actual clip earnings
          await prisma.campaign.update({
            where: { id: result.campaignId },
            data: {
              spent: result.actualSpent
            }
          })
          
          console.log(`    ✅ Synced!`)
          
          // Check if campaign should be completed due to budget
          if (result.actualSpent >= result.budget && result.status === 'ACTIVE') {
            console.log(`    ⚠️  Campaign has reached/exceeded budget - consider completing it`)
          }
        }
      }
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('📊 SUMMARY')
  console.log('='.repeat(80))
  console.log(`Total Campaigns Checked: ${results.length}`)
  console.log(`Campaigns with Discrepancies: ${campaignsWithDiscrepancies}`)
  console.log(`Total Absolute Difference: $${totalDifference.toFixed(2)}`)
  
  if (campaignsWithDiscrepancies === 0) {
    console.log('\n✅ All campaigns have accurate spend tracking!')
  } else {
    console.log(`\n⚠️  Found ${campaignsWithDiscrepancies} campaign(s) with spend discrepancies`)
    
    if (dryRun) {
      console.log('   Run without --dry-run to sync these campaigns')
    } else {
      console.log('   ✅ All discrepancies have been fixed!')
    }
  }
  console.log('='.repeat(80) + '\n')

  // Show campaigns by status
  const byStatus = {}
  for (const result of results) {
    byStatus[result.status] = byStatus[result.status] || { count: 0, totalSpent: 0, totalBudget: 0 }
    byStatus[result.status].count++
    byStatus[result.status].totalSpent += result.actualSpent
    byStatus[result.status].totalBudget += result.budget
  }

  console.log('📈 Campaigns by Status:')
  for (const [status, data] of Object.entries(byStatus)) {
    const avgUtilization = data.totalBudget > 0 
      ? (data.totalSpent / data.totalBudget) * 100 
      : 0
    console.log(`  ${status}: ${data.count} campaigns`)
    console.log(`     Total Spent: $${data.totalSpent.toFixed(2)} / $${data.totalBudget.toFixed(2)} (${avgUtilization.toFixed(1)}%)`)
  }

  // Show top campaigns by spend
  const topBySpend = results
    .filter(r => r.actualSpent > 0)
    .sort((a, b) => b.actualSpent - a.actualSpent)
    .slice(0, 5)

  if (topBySpend.length > 0) {
    console.log('\n💰 Top 5 Campaigns by Spend:')
    for (const campaign of topBySpend) {
      const utilization = (campaign.actualSpent / campaign.budget) * 100
      const status = campaign.hasDiscrepancy ? '⚠️ ' : '✅ '
      console.log(`  ${status}${campaign.title}:`)
      console.log(`      $${campaign.actualSpent.toFixed(2)} / $${campaign.budget.toFixed(2)} (${utilization.toFixed(1)}%)`)
      if (campaign.hasDiscrepancy) {
        console.log(`      Difference: ${campaign.difference > 0 ? '+' : ''}$${campaign.difference.toFixed(2)}`)
      }
    }
  }
}

async function main() {
  try {
    await syncAllCampaigns()
  } catch (error) {
    console.error('\n❌ Error syncing campaign spend:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

