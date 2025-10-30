#!/usr/bin/env node

/**
 * Verify Campaign Spend Accuracy
 * 
 * This script verifies that campaign.spent matches the sum of all
 * clip earnings for approved submissions in that campaign.
 * 
 * Usage:
 *   node scripts/verify-campaign-spend.js [--campaign-id=CAMPAIGN_ID] [--fix]
 * 
 * Options:
 *   --campaign-id  Only check a specific campaign
 *   --fix          Fix any discrepancies found
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Parse command line arguments
const args = process.argv.slice(2)
const campaignIdArg = args.find(arg => arg.startsWith('--campaign-id='))
const specificCampaignId = campaignIdArg ? campaignIdArg.split('=')[1] : null
const shouldFix = args.includes('--fix')

async function verifyCampaignSpend(campaignId) {
  // Get campaign with all approved submissions
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

  // Calculate actual total earnings from clips
  let calculatedSpent = 0
  for (const submission of campaign.clipSubmissions) {
    if (submission.clips) {
      calculatedSpent += Number(submission.clips.earnings || 0)
    }
  }

  const recordedSpent = Number(campaign.spent || 0)
  const difference = calculatedSpent - recordedSpent

  return {
    campaignId: campaign.id,
    title: campaign.title,
    status: campaign.status,
    budget: Number(campaign.budget),
    recordedSpent,
    calculatedSpent,
    difference,
    approvedClips: campaign.clipSubmissions.length,
    hasDiscrepancy: Math.abs(difference) > 0.01 // Allow for rounding errors
  }
}

async function verifyAllCampaigns() {
  console.log('\n' + '='.repeat(80))
  console.log('CAMPAIGN SPEND VERIFICATION')
  console.log('='.repeat(80))
  
  if (shouldFix) {
    console.log('🔧 Running in FIX mode - discrepancies will be corrected')
  } else {
    console.log('🔍 Running in VERIFY mode - no changes will be made')
  }
  
  console.log('='.repeat(80) + '\n')

  // Get all campaigns (or specific one)
  const whereClause = specificCampaignId ? { id: specificCampaignId } : {}
  const campaigns = await prisma.campaign.findMany({
    where: whereClause,
    select: {
      id: true
    },
    orderBy: { createdAt: 'desc' }
  })

  console.log(`📊 Found ${campaigns.length} campaign(s) to verify\n`)

  const results = []
  let campaignsWithDiscrepancies = 0
  let totalDifference = 0

  for (const campaign of campaigns) {
    const result = await verifyCampaignSpend(campaign.id)
    
    if (result) {
      results.push(result)
      
      if (result.hasDiscrepancy) {
        campaignsWithDiscrepancies++
        totalDifference += Math.abs(result.difference)
        
        console.log(`\n⚠️  Campaign: ${result.title}`)
        console.log(`    ID: ${result.campaignId}`)
        console.log(`    Status: ${result.status}`)
        console.log(`    Budget: $${result.budget.toFixed(2)}`)
        console.log(`    Recorded Spent: $${result.recordedSpent.toFixed(2)}`)
        console.log(`    Calculated Spent: $${result.calculatedSpent.toFixed(2)}`)
        console.log(`    Difference: ${result.difference > 0 ? '+' : ''}$${result.difference.toFixed(2)}`)
        console.log(`    Approved Clips: ${result.approvedClips}`)
        
        if (shouldFix) {
          console.log(`    🔧 Fixing...`)
          await prisma.campaign.update({
            where: { id: result.campaignId },
            data: {
              spent: result.calculatedSpent
            }
          })
          console.log(`    ✅ Fixed!`)
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
    
    if (!shouldFix) {
      console.log('   Run with --fix to correct these discrepancies')
    }
  }
  console.log('='.repeat(80) + '\n')

  // Show top campaigns by spend
  const topCampaigns = results
    .filter(r => r.calculatedSpent > 0)
    .sort((a, b) => b.calculatedSpent - a.calculatedSpent)
    .slice(0, 10)

  if (topCampaigns.length > 0) {
    console.log('📈 Top Campaigns by Spend:')
    for (const campaign of topCampaigns) {
      const progress = (campaign.calculatedSpent / campaign.budget) * 100
      const status = campaign.hasDiscrepancy ? '⚠️ ' : '✅ '
      console.log(`  ${status}${campaign.title}:`)
      console.log(`      Spent: $${campaign.calculatedSpent.toFixed(2)} / $${campaign.budget.toFixed(2)} (${progress.toFixed(1)}%)`)
      console.log(`      Clips: ${campaign.approvedClips}, Status: ${campaign.status}`)
    }
  }

  // Show campaigns by status
  console.log('\n📊 Campaigns by Status:')
  const statusCounts = {}
  for (const result of results) {
    statusCounts[result.status] = (statusCounts[result.status] || 0) + 1
  }
  for (const [status, count] of Object.entries(statusCounts)) {
    console.log(`  ${status}: ${count}`)
  }
}

async function main() {
  try {
    await verifyAllCampaigns()
  } catch (error) {
    console.error('\n❌ Error verifying campaign spend:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

