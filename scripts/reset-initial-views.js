/**
 * Reset Initial Views Script
 * 
 * This script resets initialViews to 0 for all submissions so that
 * ALL views count towards earnings (not just growth from initial scrape).
 * 
 * Usage:
 *   node scripts/reset-initial-views.js preview     # See what will change
 *   node scripts/reset-initial-views.js reset       # Actually reset to 0
 *   node scripts/reset-initial-views.js reset <campaignId>  # Reset specific campaign
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function previewChanges() {
  console.log('\n📊 PREVIEW: Submissions with initialViews > 0\n')
  console.log('=' .repeat(80))
  
  // Get submissions grouped by campaign
  const campaigns = await prisma.campaign.findMany({
    include: {
      clipSubmissions: {
        where: {
          initialViews: { gt: 0 }
        },
        include: {
          users: { select: { name: true, email: true } },
          clips: { select: { views: true, earnings: true } }
        }
      }
    }
  })
  
  let totalSubmissions = 0
  let totalInitialViews = BigInt(0)
  
  for (const campaign of campaigns) {
    if (campaign.clipSubmissions.length === 0) continue
    
    console.log(`\n🎬 Campaign: ${campaign.title}`)
    console.log(`   ID: ${campaign.id}`)
    console.log(`   Payout Rate: $${campaign.payoutRate}/1K views`)
    console.log(`   Submissions with initialViews > 0: ${campaign.clipSubmissions.length}`)
    console.log('')
    
    for (const sub of campaign.clipSubmissions) {
      const initialViews = BigInt(sub.initialViews || 0)
      const currentViews = BigInt(sub.clips?.views || 0)
      const currentGrowth = currentViews - initialViews
      const currentEarnings = Number(sub.clips?.earnings || 0)
      const newEarnings = (Number(currentViews) / 1000) * campaign.payoutRate
      
      console.log(`   📱 ${sub.users.name || sub.users.email}`)
      console.log(`      Status: ${sub.status} | Platform: ${sub.platform}`)
      console.log(`      Initial Views: ${Number(initialViews).toLocaleString()} → will become 0`)
      console.log(`      Current Views: ${Number(currentViews).toLocaleString()}`)
      console.log(`      Current Growth: +${Number(currentGrowth).toLocaleString()} → will become +${Number(currentViews).toLocaleString()}`)
      console.log(`      Current Earnings: $${currentEarnings.toFixed(2)} → $${newEarnings.toFixed(2)} (+$${(newEarnings - currentEarnings).toFixed(2)})`)
      console.log('')
      
      totalSubmissions++
      totalInitialViews += initialViews
    }
  }
  
  console.log('=' .repeat(80))
  console.log(`\n📈 SUMMARY:`)
  console.log(`   Total submissions to reset: ${totalSubmissions}`)
  console.log(`   Total initial views being zeroed: ${Number(totalInitialViews).toLocaleString()}`)
  console.log(`\n💡 To apply these changes, run:`)
  console.log(`   node scripts/reset-initial-views.js reset`)
  console.log(`   OR for a specific campaign:`)
  console.log(`   node scripts/reset-initial-views.js reset <campaignId>\n`)
}

async function resetInitialViews(campaignId = null) {
  console.log('\n🔄 RESETTING INITIAL VIEWS...\n')
  
  const whereClause = campaignId 
    ? { initialViews: { gt: 0 }, campaignId }
    : { initialViews: { gt: 0 } }
  
  // Get submissions to reset
  const submissions = await prisma.clipSubmission.findMany({
    where: whereClause,
    include: {
      users: { select: { id: true, name: true } },
      clips: { select: { id: true, views: true } },
      campaigns: { select: { title: true, payoutRate: true } }
    }
  })
  
  if (submissions.length === 0) {
    console.log('✅ No submissions need to be reset!')
    return
  }
  
  console.log(`Found ${submissions.length} submissions to reset...`)
  
  // Reset initialViews to 0
  const resetResult = await prisma.clipSubmission.updateMany({
    where: whereClause,
    data: { initialViews: BigInt(0) }
  })
  
  console.log(`✅ Reset ${resetResult.count} submissions' initialViews to 0`)
  
  // Now recalculate earnings for each clip
  console.log('\n💰 Recalculating earnings...\n')
  
  for (const sub of submissions) {
    if (!sub.clips || sub.status !== 'APPROVED') continue
    
    const views = Number(sub.clips.views || 0)
    const newEarnings = (views / 1000) * sub.campaigns.payoutRate
    
    await prisma.clip.update({
      where: { id: sub.clips.id },
      data: { earnings: newEarnings }
    })
    
    console.log(`   ${sub.users.name}: ${views.toLocaleString()} views → $${newEarnings.toFixed(2)}`)
  }
  
  // Recalculate user totals
  console.log('\n👥 Updating user totals...')
  
  const userIds = [...new Set(submissions.map(s => s.users.id))]
  
  for (const userId of userIds) {
    // Get sum of all clip earnings for this user
    const result = await prisma.clip.aggregate({
      where: {
        clipSubmissions: {
          some: {
            userId,
            status: { in: ['APPROVED', 'PAID'] }
          }
        }
      },
      _sum: { earnings: true }
    })
    
    const totalEarnings = Number(result._sum.earnings || 0)
    
    await prisma.user.update({
      where: { id: userId },
      data: { totalEarnings }
    })
  }
  
  console.log(`✅ Updated ${userIds.length} user totals`)
  console.log('\n🎉 Done! All initialViews reset to 0 and earnings recalculated.\n')
}

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  const campaignId = args[1]
  
  try {
    if (command === 'preview' || !command) {
      await previewChanges()
    } else if (command === 'reset') {
      await resetInitialViews(campaignId)
    } else {
      console.log('Usage:')
      console.log('  node scripts/reset-initial-views.js preview')
      console.log('  node scripts/reset-initial-views.js reset')
      console.log('  node scripts/reset-initial-views.js reset <campaignId>')
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()

