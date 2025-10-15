#!/usr/bin/env node

/**
 * Test script for payout calculation system
 * This script tests the payout calculation with real campaign data
 */

const { PrismaClient } = require('@prisma/client')
const { PayoutCalculationService } = require('../lib/payout-calculation.ts')

const prisma = new PrismaClient()

async function testPayoutCalculation() {
  console.log('🧪 Testing Payout Calculation System...')
  
  try {
    // Initialize the payout calculation service
    const payoutService = new PayoutCalculationService()
    
    // Test 1: Get all active campaigns
    console.log('\n📊 Step 1: Fetching active campaigns...')
    const activeCampaigns = await prisma.campaign.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        title: true,
        budget: true,
        spent: true,
        payoutRate: true,
        _count: {
          select: {
            clipSubmissions: {
              where: { status: 'APPROVED' }
            }
          }
        }
      }
    })
    
    console.log(`✅ Found ${activeCampaigns.length} active campaigns`)
    activeCampaigns.forEach(campaign => {
      console.log(`   - ${campaign.title}: $${campaign.spent}/$${campaign.budget} spent, ${campaign._count.clipSubmissions} approved submissions`)
    })
    
    if (activeCampaigns.length === 0) {
      console.log('⚠️  No active campaigns found. Creating test data...')
      
      // Create a test campaign if none exist
      const testCampaign = await prisma.campaign.create({
        data: {
          title: 'Test Payout Campaign',
          description: 'Test campaign for payout calculation',
          creator: 'Test Creator',
          budget: 1000,
          payoutRate: 1, // $1 per 1000 views
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          status: 'ACTIVE',
          targetPlatforms: ['TIKTOK', 'YOUTUBE']
        }
      })
      
      console.log(`✅ Created test campaign: ${testCampaign.title} (ID: ${testCampaign.id})`)
    }
    
    // Test 2: Calculate payouts for all campaigns
    console.log('\n💰 Step 2: Running payout calculations...')
    const payoutResults = await payoutService.calculateAllCampaignPayouts()
    
    console.log(`✅ Processed ${payoutResults.length} campaigns`)
    payoutResults.forEach(result => {
      console.log(`   Campaign ${result.campaignId}:`)
      console.log(`     - Total Spent: $${result.totalSpent}`)
      console.log(`     - Remaining Budget: $${result.remainingBudget}`)
      console.log(`     - Status: ${result.campaignStatus}`)
      console.log(`     - Should Complete: ${result.shouldComplete}`)
      console.log(`     - Payouts Generated: ${result.payouts.length}`)
    })
    
    // Test 3: Check view tracking data
    console.log('\n👁️  Step 3: Checking view tracking data...')
    const viewTrackingCount = await prisma.viewTracking.count()
    const recentViewTracking = await prisma.viewTracking.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: {
        clip: {
          select: {
            url: true,
            platform: true
          }
        }
      }
    })
    
    console.log(`✅ Found ${viewTrackingCount} view tracking records`)
    if (recentViewTracking.length > 0) {
      console.log('   Recent view tracking:')
      recentViewTracking.forEach(vt => {
        console.log(`     - ${vt.clip.platform}: ${vt.views} views on ${vt.date.toDateString()}`)
      })
    }
    
    // Test 4: Verify payout records
    console.log('\n💳 Step 4: Checking payout records...')
    const payoutCount = await prisma.payout.count()
    const recentPayouts = await prisma.payout.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true }
        },
        campaign: {
          select: { title: true }
        }
      }
    })
    
    console.log(`✅ Found ${payoutCount} payout records`)
    if (recentPayouts.length > 0) {
      console.log('   Recent payouts:')
      recentPayouts.forEach(payout => {
        console.log(`     - ${payout.user.name}: $${payout.amount} for ${payout.campaign.title} (${payout.status})`)
      })
    }
    
    console.log('\n🎉 Payout calculation test completed successfully!')
    
  } catch (error) {
    console.error('❌ Error during payout calculation test:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
if (require.main === module) {
  testPayoutCalculation()
    .then(() => {
      console.log('✅ Test completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Test failed:', error)
      process.exit(1)
    })
}

module.exports = { testPayoutCalculation }
