const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function diagnose() {
  try {
    console.log('\n🔍 EARNINGS DIAGNOSTIC REPORT\n')
    console.log('=' .repeat(80))
    
    // Get all campaigns
    const campaigns = await prisma.campaign.findMany({
      select: {
        id: true,
        title: true,
        budget: true,
        spent: true,
        status: true,
        _count: {
          select: {
            clipSubmissions: true
          }
        }
      }
    })
    
    console.log(`\n📊 CAMPAIGNS (${campaigns.length} total)\n`)
    for (const campaign of campaigns) {
      console.log(`Campaign: ${campaign.title}`)
      console.log(`  ID: ${campaign.id}`)
      console.log(`  Status: ${campaign.status}`)
      console.log(`  Budget: $${Number(campaign.budget).toFixed(2)}`)
      console.log(`  Recorded Spent: $${Number(campaign.spent || 0).toFixed(2)}`)
      console.log(`  Submissions: ${campaign._count.clipSubmissions}`)
      
      // Calculate actual spend from clip earnings
      const actualSpend = await prisma.clipSubmission.findMany({
        where: {
          campaignId: campaign.id,
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
      
      const actualTotal = actualSpend.reduce((sum, sub) => {
        return sum + Number(sub.clips?.earnings || 0)
      }, 0)
      
      console.log(`  Actual Spent (from clips): $${actualTotal.toFixed(2)}`)
      console.log(`  Difference: $${(actualTotal - Number(campaign.spent || 0)).toFixed(2)}`)
      console.log()
    }
    
    // Get all users with their data
    const users = await prisma.user.findMany({
      where: {
        role: 'CLIPPER'
      },
      select: {
        id: true,
        name: true,
        email: true,
        totalEarnings: true,
        totalViews: true,
        clipSubmissions: {
          where: {
            status: 'APPROVED',
            clipId: { not: null }
          },
          include: {
            clips: {
              select: {
                earnings: true,
                views: true
              }
            },
            campaigns: {
              select: {
                title: true,
                status: true
              }
            }
          }
        }
      }
    })
    
    console.log(`\n👤 USERS (${users.length} clippers)\n`)
    for (const user of users) {
      console.log(`User: ${user.name || user.email}`)
      console.log(`  ID: ${user.id}`)
      console.log(`  Cached Total Earnings: $${Number(user.totalEarnings || 0).toFixed(2)}`)
      console.log(`  Cached Total Views: ${Number(user.totalViews || 0).toLocaleString()}`)
      
      // Calculate actual earnings from clips
      const actualEarnings = user.clipSubmissions.reduce((sum, sub) => {
        return sum + Number(sub.clips?.earnings || 0)
      }, 0)
      
      const actualViews = user.clipSubmissions.reduce((sum, sub) => {
        return sum + Number(sub.clips?.views || 0)
      }, 0)
      
      console.log(`  Actual Total Earnings (from clips): $${actualEarnings.toFixed(2)}`)
      console.log(`  Actual Total Views (from clips): ${actualViews.toLocaleString()}`)
      console.log(`  Earnings Difference: $${(actualEarnings - Number(user.totalEarnings || 0)).toFixed(2)}`)
      console.log(`  Approved Submissions: ${user.clipSubmissions.length}`)
      
      // Break down by campaign
      const byCampaign = {}
      for (const sub of user.clipSubmissions) {
        const campaignTitle = sub.campaigns.title
        if (!byCampaign[campaignTitle]) {
          byCampaign[campaignTitle] = {
            count: 0,
            earnings: 0,
            status: sub.campaigns.status
          }
        }
        byCampaign[campaignTitle].count++
        byCampaign[campaignTitle].earnings += Number(sub.clips?.earnings || 0)
      }
      
      console.log(`  Breakdown by campaign:`)
      for (const [title, data] of Object.entries(byCampaign)) {
        console.log(`    - ${title} (${data.status}): ${data.count} clips, $${data.earnings.toFixed(2)}`)
      }
      console.log()
    }
    
    // Get all clips
    const totalClips = await prisma.clip.count()
    const clipsWithEarnings = await prisma.clip.findMany({
      where: {
        earnings: { gt: 0 }
      },
      select: {
        id: true,
        earnings: true,
        views: true,
        userId: true,
        clipSubmissions: {
          select: {
            campaignId: true,
            campaigns: {
              select: {
                title: true
              }
            }
          }
        }
      }
    })
    
    console.log(`\n💰 CLIPS WITH EARNINGS (${clipsWithEarnings.length} out of ${totalClips} total)\n`)
    const totalClipEarnings = clipsWithEarnings.reduce((sum, clip) => sum + Number(clip.earnings), 0)
    console.log(`Total earnings across all clips: $${totalClipEarnings.toFixed(2)}`)
    console.log()
    
    for (const clip of clipsWithEarnings.slice(0, 10)) {
      const campaign = clip.clipSubmissions[0]?.campaigns.title || 'Unknown'
      console.log(`  Clip ${clip.id.substring(0, 8)}... - $${Number(clip.earnings).toFixed(2)} (${campaign})`)
    }
    
    if (clipsWithEarnings.length > 10) {
      console.log(`  ... and ${clipsWithEarnings.length - 10} more`)
    }
    
    console.log('\n' + '='.repeat(80))
    console.log('\n✅ Diagnostic complete!\n')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

diagnose()

